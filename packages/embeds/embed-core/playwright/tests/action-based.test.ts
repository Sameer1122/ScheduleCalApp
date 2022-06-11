import { expect } from "@playwright/test";

import { test } from "../fixtures/fixtures";
import { todo, getEmbedIframe } from "../lib/testUtils";

test("should open embed iframe on click", async ({ page, addEmbedListeners, getActionFiredDetails }) => {
  const calNamespace = "prerendertestLightTheme";
  await addEmbedListeners(calNamespace);
  await page.goto("/?only=prerender-test");
  let embedIframe = await getEmbedIframe({ page, pathname: "/free" });
  expect(embedIframe).toBeFalsy();

  await page.click('[data-cal-link="free?light&popup"]');

  embedIframe = await getEmbedIframe({ page, pathname: "/free" });

  expect(embedIframe).toBeEmbedCalLink(calNamespace, getActionFiredDetails, {
    pathname: "/free",
  });
});

todo("Floating Button Test with Dark Theme");

todo("Floating Button Test with Light Theme");

todo("Add snapshot test for embed iframe");
