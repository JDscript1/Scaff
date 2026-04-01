import { z } from "zod";

const SafetyOptions = z.object({
  dryRun: z.boolean().default(false).describe("Dacă este true, nu scrie pe disc, doar simulează."),
  overwrite: z.boolean().default(false).describe("Dacă este true, permite scrierea peste fișiere existente.")
});

export const InspectStructureSchema = z.object({
  targetPath: z.string().describe("Calea către proiectul de inspectat (default '.')"),
});

export const ListTemplatesSchema = z.object({
  stack: z.enum(["react", "fastify", "android", "shared"]).optional().describe("Filtrează template-urile după stack"),
});

export const InitProjectSchema = z.object({
  projectName: z.string().min(1).describe("Numele folderului proiectului"),
  projectType: z.enum(["react-ts-vite", "fastify-ts", "android-kotlin", "monorepo"]),
  targetPath: z.string().default(".").describe("Unde va fi creat proiectul"),
  packageManager: z.enum(["pnpm", "npm", "yarn"]).default("pnpm"),
  language: z.enum(["typescript", "kotlin"]).default("typescript"),
  options: SafetyOptions.extend({
    includeDocker: z.boolean().default(false),
    includeTests: z.boolean().default(true),
    includeCI: z.boolean().default(false),
    includeLint: z.boolean().default(true),
  }).optional(),
});

export const GenerateFeatureSchema = z.object({
  featureName: z.string().min(1).describe("Numele noului feature"),
  targetStack: z.enum(["react", "fastify", "android-compose"]),
  featureType: z.enum(["crud", "auth", "ui-screen", "service", "api-resource"]),
  targetPath: z.string().optional(),
  options: SafetyOptions.optional(),
});

export const GenerateComponentSchema = z.object({
  componentName: z.string().min(1),
  framework: z.enum(["react", "compose"]),
  targetPath: z.string().optional(),
  includeStyles: z.boolean().default(true),
  options: SafetyOptions.optional(),
});

export const GenerateBackendModuleSchema = z.object({
  moduleName: z.string().min(1),
  framework: z.enum(["fastify", "express"]).default("fastify"),
  includeRoutes: z.boolean().default(true),
  includeService: z.boolean().default(true),
  includeRepository: z.boolean().default(true),
  includeSchemas: z.boolean().default(true),
  targetPath: z.string().optional(),
  options: SafetyOptions.optional(),
});

export const AddCapabilitySchema = z.object({
  capabilityName: z.enum(["docker", "ci-github", "auth-boilerplate", "eslint-prettier", "env-config"]),
  targetPath: z.string().default("."),
  options: SafetyOptions.optional(),
});

export const PreviewPlanSchema = z.object({
  requestType: z.enum(["init_project", "generate_feature", "generate_component", "generate_backend_module", "add_project_capability"]),
  payload: z.any().describe("Argumentele pentru tool-ul respectiv"),
});

export const ToolSchemas: Record<string, z.ZodSchema> = {
  "inspect_project_structure": InspectStructureSchema,
  "list_templates": ListTemplatesSchema,
  "init_project": InitProjectSchema,
  "generate_feature": GenerateFeatureSchema,
  "generate_component": GenerateComponentSchema,
  "generate_backend_module": GenerateBackendModuleSchema,
  "add_project_capability": AddCapabilitySchema,
  "preview_generation_plan": PreviewPlanSchema
};

export type InitProjectArgs = z.infer<typeof InitProjectSchema>;
export type GenerateFeatureArgs = z.infer<typeof GenerateFeatureSchema>;
export type GenerateComponentArgs = z.infer<typeof GenerateComponentSchema>;
export type GenerateBackendModuleArgs = z.infer<typeof GenerateBackendModuleSchema>;
export type AddCapabilityArgs = z.infer<typeof AddCapabilitySchema>;
export type ListTemplatesArgs = z.infer<typeof ListTemplatesSchema>;
export type PreviewPlanArgs = z.infer<typeof PreviewPlanSchema>;
