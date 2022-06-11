import { SelectorIcon } from "@heroicons/react/outline";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  CogIcon,
  ExternalLinkIcon,
  LinkIcon,
  LogoutIcon,
  MapIcon,
  MoonIcon,
  ViewGridIcon,
} from "@heroicons/react/solid";
import { SessionContextValue, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { Fragment, ReactNode, useEffect } from "react";
import { Toaster } from "react-hot-toast";

import { useIsEmbed } from "@calcom/embed-core";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { UserPlan } from "@calcom/prisma/client";
import Button from "@calcom/ui/Button";
import Dropdown, {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@calcom/ui/Dropdown";
import LicenseBanner from "@ee/components/LicenseBanner";
import TrialBanner from "@ee/components/TrialBanner";
import HelpMenuItem from "@ee/components/support/HelpMenuItem";

import classNames from "@lib/classNames";
import { WEBAPP_URL } from "@lib/config/constants";
import { shouldShowOnboarding } from "@lib/getting-started";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@lib/telemetry";
import { trpc } from "@lib/trpc";

import CustomBranding from "@components/CustomBranding";
import Loader from "@components/Loader";
import { HeadSeo } from "@components/seo/head-seo";

import pkg from "../package.json";
import { useViewerI18n } from "./I18nLanguageHandler";
import Logo from "./Logo";

import { Typography } from "antd";
import styled from "styled-components";

export function useMeQuery() {
  const meQuery = trpc.useQuery(["viewer.me"], {
    retry(failureCount) {
      return failureCount > 3;
    },
  });

  return meQuery;
}

function useRedirectToLoginIfUnauthenticated(isPublic = false) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();

  useEffect(() => {
    if (isPublic) {
      return;
    }

    if (!loading && !session) {
      router.replace({
        pathname: "/auth/login",
        query: {
          callbackUrl: `${WEBAPP_URL}/${location.pathname}${location.search}`,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, isPublic]);

  return {
    loading: loading && !session,
    session,
  };
}

function useRedirectToOnboardingIfNeeded() {
  const router = useRouter();
  const query = useMeQuery();
  const user = query.data;

  const isRedirectingToOnboarding = user && shouldShowOnboarding(user);

  useEffect(() => {
    if (isRedirectingToOnboarding) {
      router.replace({
        pathname: "/getting-started",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRedirectingToOnboarding]);
  return {
    isRedirectingToOnboarding,
  };
}

export function ShellSubHeading(props: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={classNames("mb-3 block justify-between sm:flex", props.className)}>
      <div>
        <h2 className="flex content-center items-center space-x-2 text-base font-bold leading-6 text-gray-900 rtl:space-x-reverse">
          {props.title}
        </h2>
        {props.subtitle && <p className="text-sm text-neutral-500 ltr:mr-4">{props.subtitle}</p>}
      </div>
      {props.actions && <div className="flex-shrink-0">{props.actions}</div>}
    </div>
  );
}

const Layout = ({
  status,
  plan,
  ...props
}: LayoutProps & { status: SessionContextValue["status"]; plan?: UserPlan }) => {
  const isEmbed = useIsEmbed();
  const router = useRouter();
  const { t } = useLocale();
  const navigation = [
    {
      name: t("event_types_page_title"),
      href: "/event-types",
      icon: LinkIcon,
      current: router.asPath.startsWith("/event-types"),
    },
    {
      name: t("bookings"),
      href: "/bookings/upcoming",
      icon: CalendarIcon,
      current: router.asPath.startsWith("/bookings"),
    },
    {
      name: t("availability"),
      href: "/availability",
      icon: ClockIcon,
      current: router.asPath.startsWith("/availability"),
    },
    {
      name: t("apps"),
      href: "/apps",
      icon: ViewGridIcon,
      current: router.asPath.startsWith("/apps"),
      child: [
        {
          name: t("app_store"),
          href: "/apps",
          current: router.asPath === "/apps",
        },
        {
          name: t("installed_apps"),
          href: "/apps/installed",
          current: router.asPath === "/apps/installed",
        },
      ],
    },
    {
      name: t("settings"),
      href: "/settings/profile",
      icon: CogIcon,
      current: router.asPath.startsWith("/settings"),
    },
  ];
  const pageTitle = typeof props.heading === "string" ? props.heading : props.title;
  const StyledText = styled(Typography.Text)`
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 28px;
    color: #3d3935;
    margin-bottom: 10px;
  `;
  return (
    <>
      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        <main
          className={classNames(
            "relative z-0 flex-1 overflow-y-auto focus:outline-none",
            props.flexChildrenContainer && "flex flex-col"
          )}>
          
          <div
            className={classNames(
              props.centered && "mx-auto md:max-w-5xl",
              props.flexChildrenContainer && "flex flex-1 flex-col",
              !props.large && "py-8"
            )}>
            {!!props.backPath && (
              <div className="mx-3 mb-8 sm:mx-8">
                <Button
                  onClick={() => router.push(props.backPath as string)}
                  StartIcon={ArrowLeftIcon}
                  color="secondary">
                  Back
                </Button>
              </div>
            )}
            {props.heading && (
              <div
                className={classNames(
                  props.large && "bg-gray-100 py-8 lg:mb-8 lg:pt-16 lg:pb-7",
                  "block min-h-[80px] justify-between px-4 sm:flex sm:px-6 md:px-8"
                )}>
                {props.HeadingLeftIcon && <div className="ltr:mr-4">{props.HeadingLeftIcon}</div>}
                <div className="mb-8 w-full">
                  <StyledText>{props.heading}</StyledText>
                </div>
                {props.CTA && <div className="mb-4 flex-shrink-0">{props.CTA}</div>}
              </div>
            )}
            <div
              className={classNames(
                "px-4 sm:px-6 md:px-8",
                props.flexChildrenContainer && "flex flex-1 flex-col"
              )}>
              {props.children}
            </div>
            <div className="block pt-12 md:hidden" />
          </div>
          {/* <LicenseBanner /> */}
        </main>
      </div>
    </>
  );
};

const MemoizedLayout = React.memo(Layout);

type LayoutProps = {
  centered?: boolean;
  title?: string;
  heading?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  CTA?: ReactNode;
  large?: boolean;
  HeadingLeftIcon?: ReactNode;
  backPath?: string; // renders back button to specified path
  // use when content needs to expand with flex
  flexChildrenContainer?: boolean;
  isPublic?: boolean;
};

export default function Shell(props: LayoutProps) {
  const router = useRouter();
  const { loading, session } = useRedirectToLoginIfUnauthenticated(props.isPublic);
  const { isRedirectingToOnboarding } = useRedirectToOnboardingIfNeeded();
  const telemetry = useTelemetry();

  useEffect(() => {
    telemetry.withJitsu((jitsu) => {
      return jitsu.track(telemetryEventTypes.pageView, collectPageParameters(router.asPath));
    });
  }, [telemetry, router.asPath]);

  const query = useMeQuery();
  const user = query.data;

  const i18n = useViewerI18n();
  const { status } = useSession();

  if (i18n.status === "loading" || query.status === "loading" || isRedirectingToOnboarding || loading) {
    // show spinner whilst i18n is loading to avoid language flicker
    return (
      <div className="absolute z-50 flex h-screen w-full items-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  if (!session && !props.isPublic) return null;

  return (
    <>
      {/* <CustomBranding lightVal={user?.brandColor} darkVal={user?.darkBrandColor} /> */}
      <MemoizedLayout plan={user?.plan} status={status} {...props} />
    </>
  );
}

function UserDropdown({ small }: { small?: boolean }) {
  const { t } = useLocale();
  const query = useMeQuery();
  const user = query.data;
  const mutation = trpc.useMutation("viewer.away", {
    onSettled() {
      utils.invalidateQueries("viewer.me");
    },
  });
  const utils = trpc.useContext();

  return (
    <Dropdown>
      <DropdownMenuTrigger asChild>
        <button className="group flex w-full cursor-pointer appearance-none items-center text-left">
          <span
            className={classNames(
              small ? "h-8 w-8" : "h-10 w-10",
              "relative flex-shrink-0 rounded-full bg-gray-300  ltr:mr-3 rtl:ml-3"
            )}>
            <img
              className="rounded-full"
              src={process.env.NEXT_PUBLIC_WEBSITE_URL + "/" + user?.username + "/avatar.png"}
              alt={user?.username || "Nameless User"}
            />
            {!user?.away && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
            )}
            {user?.away && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-yellow-500"></div>
            )}
          </span>
          {!small && (
            <span className="flex flex-grow items-center truncate">
              <span className="flex-grow truncate text-sm">
                <span className="block truncate font-medium text-gray-900">
                  {user?.username || "Nameless User"}
                </span>
                <span className="block truncate font-normal text-neutral-500">
                  {user?.username ? `cal.com/${user.username}` : "No public page"}
                </span>
              </span>
              <SelectorIcon
                className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                aria-hidden="true"
              />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent portalled={true}>
        <DropdownMenuItem>
          <a
            onClick={() => {
              mutation.mutate({ away: !user?.away });
              utils.invalidateQueries("viewer.me");
            }}
            className="flex min-w-max cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900">
            <MoonIcon
              className={classNames(
                user?.away
                  ? "text-purple-500 group-hover:text-purple-700"
                  : "text-gray-500 group-hover:text-gray-700",
                "h-5 w-5 flex-shrink-0 ltr:mr-3 rtl:ml-3"
              )}
              aria-hidden="true"
            />
            {user?.away ? t("set_as_free") : t("set_as_away")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="h-px bg-gray-200" />
        {user?.username && (
          <DropdownMenuItem>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${user.username}`}
              className="flex items-center px-4 py-2 text-sm text-gray-700">
              <ExternalLinkIcon className="h-5 w-5 text-gray-500 ltr:mr-3 rtl:ml-3" /> {t("view_public_page")}
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="h-px bg-gray-200" />
        <DropdownMenuItem>
          <a
            href="https://cal.com/slack"
            target="_blank"
            rel="noreferrer"
            className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
            <svg
              viewBox="0 0 2447.6 2452.5"
              className={classNames(
                "text-gray-500 group-hover:text-gray-700",
                "mt-0.5 h-4 w-4 flex-shrink-0 ltr:mr-4 rtl:ml-4"
              )}
              xmlns="http://www.w3.org/2000/svg">
              <g clipRule="evenodd" fillRule="evenodd">
                <path
                  d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z"
                  fill="currentColor"></path>
                <path
                  d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z"
                  fill="currentColor"></path>
                <path
                  d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z"
                  fill="currentColor"></path>
                <path
                  d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0"
                  fill="currentColor"></path>
              </g>
            </svg>
            {t("join_our_slack")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://cal.com/roadmap"
            className="flex items-center px-4 py-2 text-sm text-gray-700">
            <MapIcon className="h-5 w-5 text-gray-500 ltr:mr-3 rtl:ml-3" /> {t("visit_roadmap")}
          </a>
        </DropdownMenuItem>

        <HelpMenuItem />

        <DropdownMenuSeparator className="h-px bg-gray-200" />
        <DropdownMenuItem>
          <a
            onClick={() => signOut({ callbackUrl: "/auth/logout" })}
            className="flex cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900">
            <LogoutIcon
              className={classNames(
                "text-gray-500 group-hover:text-gray-700",
                "h-5 w-5 flex-shrink-0 ltr:mr-3 rtl:ml-3"
              )}
              aria-hidden="true"
            />
            {t("sign_out")}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </Dropdown>
  );
}
