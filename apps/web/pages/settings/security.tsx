import { IdentityProvider } from "@prisma/client";
import React from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import ApiKeyListContainer from "@ee/components/apiKeys/ApiKeyListContainer";
import SAMLConfiguration from "@ee/components/saml/Configuration";

import { identityProviderNameMap } from "@lib/auth";
import { trpc } from "@lib/trpc";

import SettingsShell from "@components/SettingsShell";
import Shell from "@components/Shell-old";
import ChangePasswordSection from "@components/security/ChangePasswordSection";
import TwoFactorAuthSection from "@components/security/TwoFactorAuthSection";

export default function Security() {
  const user = trpc.useQuery(["viewer.me"]).data;
  const { t } = useLocale();
  return (
    <Shell heading={t("security")} subtitle={t("manage_account_security")}>
      <SettingsShell>
        {user && user.identityProvider !== IdentityProvider.CAL ? (
          <>
            <div className="mt-6">
              <h2 className="font-cal text-lg font-medium leading-6 text-gray-900">
                {t("account_managed_by_identity_provider", {
                  provider: identityProviderNameMap[user.identityProvider],
                })}
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {t("account_managed_by_identity_provider_description", {
                provider: identityProviderNameMap[user.identityProvider],
              })}
            </p>
          </>
        ) : (
          <div className="space-y-2 divide-y">
            <ChangePasswordSection />
            <ApiKeyListContainer />
            <TwoFactorAuthSection twoFactorEnabled={user?.twoFactorEnabled || false} />
          </div>
        )}

        <SAMLConfiguration teamsView={false} teamId={null} />
      </SettingsShell>
    </Shell>
  );
}
