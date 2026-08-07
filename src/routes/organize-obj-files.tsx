import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/organize-obj-files")({
  beforeLoad: () => {
    throw redirect({
      to: "/organize-obj-files-for-3d-printing",
      statusCode: 301,
      replace: true,
    });
  },
});
