import { expect, test } from "@playwright/test";

import * as teardown from "./lib/teardown";
import { selectFirstAvailableTimeSlotNextMonth, todo } from "./lib/testUtils";

const IS_STRIPE_ENABLED = !!(
  process.env.STRIPE_CLIENT_ID &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY &&
  process.env.STRIPE_PRIVATE_KEY
);

test.describe.serial("Stripe integration", () => {
  test.afterAll(() => {
    teardown.deleteAllPaymentsByEmail("pro@example.com");
    teardown.deleteAllBookingsByEmail("pro@example.com");
    teardown.deleteAllPaymentCredentialsByEmail("pro@example.com");
  });
  test.skip(!IS_STRIPE_ENABLED, "It should only run if Stripe is installed");

  test.describe.serial("Stripe integration dashboard", () => {
    test.use({ storageState: "playwright/artifacts/proStorageState.json" });

    test("Can add Stripe integration", async ({ page }) => {
      await page.goto("/apps/installed");
      /** We should see the "Connect" button for Stripe */
      await expect(
        page.locator(`li:has-text("Stripe") >> [data-testid="integration-connection-button"]`)
      ).toContainText("Connect");

      /** We start the Stripe flow */
      await Promise.all([
        page.waitForNavigation({ url: "https://connect.stripe.com/oauth/v2/authorize?*" }),
        page.click('li:has-text("Stripe") >> [data-testid="integration-connection-button"]'),
      ]);

      await Promise.all([
        page.waitForNavigation({ url: "/apps/installed" }),
        /** We skip filling Stripe forms (testing mode only) */
        page.click('[id="skip-account-app"]'),
      ]);

      /** If Stripe is added correctly we should see the "Disconnect" button */
      await expect(
        page.locator(`li:has-text("Stripe") >> [data-testid="integration-connection-button"]`)
      ).toContainText("Disconnect");
    });
  });

  test("Can book a paid booking", async ({ page }) => {
    await page.goto("/pro/paid");
    await selectFirstAvailableTimeSlotNextMonth(page);
    // --- fill form
    await page.fill('[name="name"]', "Stripe Stripeson");
    await page.fill('[name="email"]', "test@example.com");

    await Promise.all([page.waitForNavigation({ url: "/payment/*" }), page.press('[name="email"]', "Enter")]);

    const stripeFrame = page
      .frameLocator('iframe[src^="https://js.stripe.com/v3/elements-inner-card-"]')
      .first();

    // Fill [placeholder="Card number"]
    await stripeFrame.locator('[placeholder="Card number"]').fill("4242 4242 4242 4242");
    // Fill [placeholder="MM / YY"]
    await stripeFrame.locator('[placeholder="MM / YY"]').fill("12 / 24");
    // Fill [placeholder="CVC"]
    await stripeFrame.locator('[placeholder="CVC"]').fill("111");
    // Fill [placeholder="ZIP"]
    await stripeFrame.locator('[placeholder="ZIP"]').fill("11111");
    // Click button:has-text("Pay now")
    await page.click('button:has-text("Pay now")');

    // Make sure we're navigated to the success page
    await page.waitForNavigation({
      url(url) {
        return url.pathname.endsWith("/success");
      },
    });
  });

  todo("Pending payment booking should not be confirmed by default");
  todo("Payment should confirm pending payment booking");
  todo("Payment should trigger a BOOKING_PAID webhook");
  todo("Paid booking should be able to be rescheduled");
  todo("Paid booking should be able to be cancelled");
  todo("Cancelled paid booking should be refunded");
});
