import { expect, Frame } from "@playwright/test";

import { test } from "../fixtures/fixtures";
import { todo, getEmbedIframe } from "../lib/testUtils";

test("Inline Iframe - Configured with Dark Theme", async ({
  page,
  getActionFiredDetails,
  addEmbedListeners,
}) => {
  await addEmbedListeners("");
  await page.goto("/?only=ns:default");
  const embedIframe = await getEmbedIframe({ page, pathname: "/pro" });
  expect(embedIframe).toBeEmbedCalLink("", getActionFiredDetails, {
    pathname: "/pro",
    searchParams: {
      theme: "dark",
    },
  });
});

todo(
  "Ensure that on all pages - [user], [user]/[type], team/[slug], team/[slug]/book, UI styling works if these pages are directly linked in embed"
);

todo("Check that UI Configuration doesn't work for Free Plan");
