import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  advisoriesTable,
  db,
  farmsTable,
  usersTable,
} from "@workspace/db";
import {
  CreateFarmBody,
  CreateFarmHeader,
  CreateFarmResponse,
  CreateUserBody,
  CreateUserResponse,
  GenerateAdvisoryBody,
  GenerateAdvisoryHeader,
  GenerateAdvisoryResponse,
  GetAdvisoryParams,
  GetAdvisoryHeader,
  GetAdvisoryResponse,
  GetDashboardSummaryHeader,
  GetFarmHeader,
  GetFarmParams,
  GetFarmResponse,
  ListAdvisoriesHeader,
  ListAdvisoriesResponse,
  ListFarmsHeader,
  ListFarmsResponse,
  GetDashboardSummaryResponse,
} from "@workspace/api-zod";
import { generateAgrobrainReport } from "../lib/agrobrain-ai";

const router: IRouter = Router();

function farmResponse(farm: typeof farmsTable.$inferSelect) {
  return CreateFarmResponse.parse(farm);
}

function summaryResponse(row: {
  id: string;
  farmId: string;
  farmName: string;
  targetSeason: string;
  budgetLevel: string;
  report: unknown;
  createdAt: Date;
}) {
  const report = GetAdvisoryResponse.shape.report.parse(row.report);
  return {
    id: row.id,
    farmId: row.farmId,
    farmName: row.farmName,
    targetSeason: row.targetSeason,
    budgetLevel: row.budgetLevel,
    topCrop: report.recommendedCrops[0]?.cropName ?? "No crop selected",
    topScore: report.recommendedCrops[0]?.suitabilityScore ?? 0,
    createdAt: row.createdAt,
  };
}

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email))
    .limit(1);
  if (existing[0]) {
    res.status(201).json(CreateUserResponse.parse(existing[0]));
    return;
  }

  const [user] = await db.insert(usersTable).values(parsed.data).returning();
  res.status(201).json(CreateUserResponse.parse(user));
});

router.get("/farms", async (req, res): Promise<void> => {
  const header = ListFarmsHeader.safeParse({ "x-user-id": req.header("x-user-id") });
  if (!header.success) {
    res.status(401).json({ error: "A valid x-user-id header is required" });
    return;
  }

  const farms = await db
    .select()
    .from(farmsTable)
    .where(eq(farmsTable.userId, header.data["x-user-id"]))
    .orderBy(desc(farmsTable.createdAt));
  res.json(ListFarmsResponse.parse(farms));
});

router.post("/farms", async (req, res): Promise<void> => {
  const header = CreateFarmHeader.safeParse({ "x-user-id": req.header("x-user-id") });
  if (!header.success) {
    res.status(401).json({ error: "A valid x-user-id header is required" });
    return;
  }
  const parsed = CreateFarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, header.data["x-user-id"]))
    .limit(1);
  if (!user[0]) {
    res.status(401).json({ error: "User session not found" });
    return;
  }

  const [farm] = await db
    .insert(farmsTable)
    .values({ ...parsed.data, userId: header.data["x-user-id"] })
    .returning();
  res.status(201).json(farmResponse(farm));
});

router.get("/farms/:id", async (req, res): Promise<void> => {
  const header = GetFarmHeader.safeParse({ "x-user-id": req.header("x-user-id") });
  const params = GetFarmParams.safeParse(req.params);
  if (!header.success || !params.success) {
    res.status(400).json({ error: "Invalid farm request" });
    return;
  }

  const [farm] = await db
    .select()
    .from(farmsTable)
    .where(
      and(
        eq(farmsTable.id, params.data.id),
        eq(farmsTable.userId, header.data["x-user-id"]),
      ),
    )
    .limit(1);
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }
  res.json(GetFarmResponse.parse(farm));
});

router.get("/advisories", async (req, res): Promise<void> => {
  const header = ListAdvisoriesHeader.safeParse({ "x-user-id": req.header("x-user-id") });
  if (!header.success) {
    res.status(401).json({ error: "A valid x-user-id header is required" });
    return;
  }

  const rows = await db
    .select({
      id: advisoriesTable.id,
      farmId: advisoriesTable.farmId,
      farmName: farmsTable.name,
      targetSeason: advisoriesTable.targetSeason,
      budgetLevel: advisoriesTable.budgetLevel,
      report: advisoriesTable.aiRawResponse,
      createdAt: advisoriesTable.createdAt,
    })
    .from(advisoriesTable)
    .innerJoin(farmsTable, eq(advisoriesTable.farmId, farmsTable.id))
    .where(eq(farmsTable.userId, header.data["x-user-id"]))
    .orderBy(desc(advisoriesTable.createdAt));
  res.json(ListAdvisoriesResponse.parse(rows.map(summaryResponse)));
});

router.post("/advisories/generate", async (req, res): Promise<void> => {
  const header = GenerateAdvisoryHeader.safeParse({ "x-user-id": req.header("x-user-id") });
  const parsed = GenerateAdvisoryBody.safeParse(req.body);
  if (!header.success) {
    res.status(401).json({ error: "A valid x-user-id header is required" });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [farm] = await db
    .select()
    .from(farmsTable)
    .where(
      and(
        eq(farmsTable.id, parsed.data.farmId),
        eq(farmsTable.userId, header.data["x-user-id"]),
      ),
    )
    .limit(1);
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  try {
    const report = await generateAgrobrainReport(farm, parsed.data);
    const [advisory] = await db
      .insert(advisoriesTable)
      .values({
        farmId: farm.id,
        targetSeason: parsed.data.targetSeason,
        budgetLevel: parsed.data.budgetLevel,
        specificConcerns: parsed.data.specificConcerns.replace(/<[^>]*>/g, "").trim(),
        aiRawResponse: report,
      })
      .returning();
    const result = {
      id: advisory.id,
      farmId: advisory.farmId,
      farmName: farm.name,
      region: farm.region,
      targetSeason: advisory.targetSeason,
      budgetLevel: advisory.budgetLevel,
      specificConcerns: advisory.specificConcerns,
      report,
      createdAt: advisory.createdAt,
    };
    res.status(201).json(GenerateAdvisoryResponse.parse(result));
  } catch (error) {
    req.log.error({ err: error }, "Advisory generation failed");
    res.status(502).json({ error: "The advisory engine could not produce a valid report. Please retry." });
  }
});

router.get("/advisories/:id", async (req, res): Promise<void> => {
  const header = GetAdvisoryHeader.safeParse({ "x-user-id": req.header("x-user-id") });
  const params = GetAdvisoryParams.safeParse(req.params);
  if (!header.success || !params.success) {
    res.status(400).json({ error: "Invalid advisory request" });
    return;
  }

  const [row] = await db
    .select({
      id: advisoriesTable.id,
      farmId: advisoriesTable.farmId,
      farmName: farmsTable.name,
      region: farmsTable.region,
      targetSeason: advisoriesTable.targetSeason,
      budgetLevel: advisoriesTable.budgetLevel,
      specificConcerns: advisoriesTable.specificConcerns,
      report: advisoriesTable.aiRawResponse,
      createdAt: advisoriesTable.createdAt,
    })
    .from(advisoriesTable)
    .innerJoin(farmsTable, eq(advisoriesTable.farmId, farmsTable.id))
    .where(
      and(
        eq(advisoriesTable.id, params.data.id),
        eq(farmsTable.userId, header.data["x-user-id"]),
      ),
    )
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Advisory not found" });
    return;
  }
  res.json(GetAdvisoryResponse.parse(row));
});

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const header = GetDashboardSummaryHeader.safeParse({ "x-user-id": req.header("x-user-id") });
  if (!header.success) {
    res.status(401).json({ error: "A valid x-user-id header is required" });
    return;
  }

  const farms = await db
    .select()
    .from(farmsTable)
    .where(eq(farmsTable.userId, header.data["x-user-id"]))
    .orderBy(desc(farmsTable.createdAt));
  const rows = await db
    .select({
      id: advisoriesTable.id,
      farmId: advisoriesTable.farmId,
      farmName: farmsTable.name,
      targetSeason: advisoriesTable.targetSeason,
      budgetLevel: advisoriesTable.budgetLevel,
      report: advisoriesTable.aiRawResponse,
      createdAt: advisoriesTable.createdAt,
    })
    .from(advisoriesTable)
    .innerJoin(farmsTable, eq(advisoriesTable.farmId, farmsTable.id))
    .where(eq(farmsTable.userId, header.data["x-user-id"]))
    .orderBy(desc(advisoriesTable.createdAt));
  const advisories = rows.map(summaryResponse);
  const averageSuitability =
    advisories.length === 0
      ? 0
      : advisories.reduce((sum, advisory) => sum + advisory.topScore, 0) /
        advisories.length;
  res.json(
    GetDashboardSummaryResponse.parse({
      farmCount: farms.length,
      advisoryCount: advisories.length,
      averageSuitability,
      latestAdvisory: advisories[0] ?? null,
      farms,
    }),
  );
});

export default router;