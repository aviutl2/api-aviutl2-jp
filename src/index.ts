import { Hono } from "hono";
import { describeRoute, openAPIRouteHandler, resolver } from "hono-openapi";
import z from "zod";
import { dedent } from "./utils.ts";
import { aviutl2VersionSchema, fetchAviUtl2Versions, versionsSchema } from "./scraping.ts";

const app = new Hono();
const downloadTypeSchema = z.enum(["installer", "zip"]);
const errorSchema = z.object({
  message: z.string(),
});

app.get(
  "/",
  describeRoute({
    description: "Landing page",
    responses: {
      200: {
        description: "Successful response",
        content: {
          "text/markdown": { schema: { type: "string" } },
        },
      },
    },
  }),
  (c) => {
    c.header("Content-Type", "text/plain; charset=utf-8");
    return c.text(
      dedent(`
				# api.aviutl2.jp

				api.aviutl2.jp へようこそ！使い方は https://github.com/aviutl2/api-aviutl2-jp をご覧ください。
			`),
    );
  },
);

app.get(
  "/versions",
  describeRoute({
    description: "Get AviUtl2 versions",
    responses: {
      200: {
        description: "A list of AviUtl2 versions",
        content: {
          "application/json": { schema: resolver(versionsSchema) },
        },
      },
    },
  }),
  async (c) => {
    return c.json({
      versions: await fetchAviUtl2Versions(),
    });
  },
);

app.get(
  "/versions/latest",
  describeRoute({
    description: "Get latest AviUtl2 version",
    responses: {
      200: {
        description: "Latest AviUtl2 version",
        content: {
          "application/json": { schema: resolver(aviutl2VersionSchema) },
        },
      },
      404: {
        description: "No versions available",
        content: {
          "application/json": { schema: resolver(errorSchema) },
        },
      },
    },
  }),
  async (c) => {
    const versions = await fetchAviUtl2Versions();
    const latest = versions[0];
    if (!latest) {
      return c.json({ message: "No versions available" }, 404);
    }
    return c.json(latest);
  },
);

app.get(
  "/versions/:version",
  describeRoute({
    description: "Get AviUtl2 version by version string",
    responses: {
      200: {
        description: "AviUtl2 version",
        content: {
          "application/json": { schema: resolver(aviutl2VersionSchema) },
        },
      },
      404: {
        description: "Version not found",
        content: {
          "application/json": { schema: resolver(errorSchema) },
        },
      },
    },
  }),
  async (c) => {
    const version = c.req.param("version");
    const versions = await fetchAviUtl2Versions();
    const matched = versions.find((item) => item.version === version);
    if (!matched) {
      return c.json({ message: "Version not found" }, 404);
    }
    return c.json(matched);
  },
);

app.get(
  "/download",
  describeRoute({
    description: "Redirect to AviUtl2 download link",
    parameters: [
      {
        name: "version",
        in: "query",
        required: true,
        schema: { type: "string" },
        description: "Version string or 'latest'",
      },
      {
        name: "type",
        in: "query",
        required: true,
        schema: {
          type: "string",
          enum: ["installer", "zip"],
        },
      },
    ],
    responses: {
      302: {
        description: "Redirect to download URL",
        content: {
          "text/plain": { schema: { type: "string" } },
        },
      },
      400: {
        description: "Invalid request",
        content: {
          "application/json": { schema: resolver(errorSchema) },
        },
      },
      404: {
        description: "Version not found",
        content: {
          "application/json": { schema: resolver(errorSchema) },
        },
      },
    },
  }),
  async (c) => {
    const version = c.req.query("version");
    const type = c.req.query("type");
    const parsedType = downloadTypeSchema.safeParse(type);
    if (!version || !parsedType.success) {
      return c.json({ message: "Invalid query parameters" }, 400);
    }
    const versions = await fetchAviUtl2Versions();
    const matched = version === "latest"
      ? versions[0]
      : versions.find((item) => item.version === version);
    if (!matched) {
      return c.json({ message: "Version not found" }, 404);
    }
    const url = parsedType.data === "zip" ? matched.downloads.zip : matched.downloads.exe;
    return c.redirect(url, 302);
  },
);

app.get(
  "/openapi.json",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "api.aviutl2.jp",
        version: "0.0.0",
        description: "API for AviUtl2 versions and downloads",
      },
    },
  }),
);

export default app;
