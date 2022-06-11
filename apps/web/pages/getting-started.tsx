import { zodResolver } from "@hookform/resolvers/zod";
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import omit from "lodash/omit";
import { NextPageContext } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import TimezoneSelect from "react-timezone-select";

import getApps from "@calcom/app-store/utils";
import { getCalendarCredentials, getConnectedCalendars } from "@calcom/core/CalendarManager";
import { ResponseUsernameApi } from "@calcom/ee/lib/core/checkPremiumUsername";

import { getSession } from "@lib/auth";
import { useLocale } from "@lib/hooks/useLocale";
import prisma from "@lib/prisma";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@lib/telemetry";
import { trpc } from "@lib/trpc";
import { inferSSRProps } from "@lib/types/inferSSRProps";
import { Schedule as ScheduleType } from "@lib/types/schedule";

import { ClientSuspense } from "@components/ClientSuspense";
import Loader from "@components/Loader";
import Schedule from "@components/availability/Schedule";
import { CalendarListContainer } from "@components/integrations/CalendarListContainer";
// import Text from "@components/ui/Text";

import getEventTypes from "../lib/queries/event-types/get-event-types";

import {
  Layout,
  Menu,
  Image,
  Button,
  Typography,
  Select,
  Steps,
  message,
  Space,
  Input,
  Divider,
  Checkbox
} from "antd";

import styled from "styled-components";
const { Header, Content, Footer } = Layout;
const { Text } = Typography;
const { Option } = Select;
import UserOutlined from "@ant-design/icons/UserOutlined";
const { Step } = Steps;
const StyledCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
  align-self: center;
  justify-self: center;
  background: #ffffff;
  box-shadow: 0px 4px 8px -2px rgba(16, 24, 40, 0.1),
    0px 2px 4px -2px rgba(16, 24, 40, 0.06);
`;

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);

let mutationComplete: ((err: Error | null) => void) | null;

export default function Onboarding(props: inferSSRProps<typeof getServerSideProps>) {
  const { t } = useLocale();
  const router = useRouter();
  const telemetry = useTelemetry();

  const mutation = trpc.useMutation("viewer.updateProfile", {
    onSuccess: async () => {
      setSubmitting(true);
      if (mutationComplete) {
        mutationComplete(null);
        mutationComplete = null;
      }
      setSubmitting(false);
    },
    onError: (err) => {
      setError(new Error(err.message));
      if (mutationComplete) {
        mutationComplete(new Error(err.message));
      }
      setSubmitting(false);
    },
  });

  const DEFAULT_EVENT_TYPES = [
    {
      title: t("15min_meeting"),
      slug: "15min",
      length: 15,
    },
    {
      title: t("30min_meeting"),
      slug: "30min",
      length: 30,
    },
    {
      title: t("secret_meeting"),
      slug: "secret",
      length: 15,
      hidden: true,
    },
  ];

  const [isSubmitting, setSubmitting] = React.useState(false);
  const [enteredName, setEnteredName] = React.useState("");
  const [scheduleStart, setScheduleStart] = React.useState(8);
  const [scheduleEnd, setScheduleEnd] = React.useState(18);
  const [availableSun, setAvailableSun] = React.useState(false);
  const [availableMon, setAvailableMon] = React.useState(true);
  const [availableTue, setAvailableTue] = React.useState(true);
  const [availableWed, setAvailableWed] = React.useState(true);
  const [availableThu, setAvailableThu] = React.useState(true);
  const [availableFri, setAvailableFri] = React.useState(true);
  const [availableSat, setAvailableSat] = React.useState(false);
  const { status } = useSession();
  const loading = status === "loading";
  const [ready, setReady] = useState(false);
  const [selectedImport, setSelectedImport] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const updateUser = async (data: Prisma.UserUpdateInput) => {
    const res = await fetch(`/api/user/${props.user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ data: { ...data } }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error((await res.json()).message);
    }
    const responseData = await res.json();
    return responseData.data;
  };

  const createEventType = async (data: Prisma.EventTypeCreateInput) => {
    const res = await fetch(`/api/availability/eventtype`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error((await res.json()).message);
    }
    const responseData = await res.json();
    return responseData.data;
  };

  const createSchedule = trpc.useMutation("viewer.availability.schedule.create", {
    onError: (err) => {
      throw new Error(err.message);
    },
  });

  /** Name */
  const nameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLInputElement>(null);
  /** End Name */
  /** TimeZone */
  const [selectedTimeZone, setSelectedTimeZone] = useState(props.user.timeZone ?? dayjs.tz.guess());
  /** End TimeZone */

  /** Onboarding Steps */
  const [currentStep, setCurrentStep] = useState(0);
  const detectStep = () => {
    // Always set timezone if new user
    let step = 0;

    const hasConfigureCalendar = props.integrations.some((integration) => integration.credential !== null);
    if (hasConfigureCalendar) {
      step = 1;
    }

    const hasSchedules = props.schedules && props.schedules.length > 0;
    if (hasSchedules) {
      step = 2;
    }

    setCurrentStep(step);
  };

  const handleConfirmStep = async () => {
    try {
      setSubmitting(true);
      if (
        steps[currentStep] &&
        steps[currentStep].onComplete &&
        typeof steps[currentStep].onComplete === "function"
      ) {
        await steps[currentStep].onComplete!();
      }
      incrementStep();
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
      setError(error as Error);
    }
  };

  // const debouncedHandleConfirmStep = debounce(handleConfirmStep, 850);

  const incrementStep = () => {
    const nextStep = currentStep + 1;

    if (nextStep >= steps.length) {
      completeOnboarding();
      return;
    }
    setCurrentStep(nextStep);
  };

  const decrementStep = () => {
    const previous = currentStep - 1;

    if (previous < 0) {
      return;
    }
    setCurrentStep(previous);
  };

  /**
   * Complete Onboarding finalizes the onboarding flow for a new user.
   *
   * Here, 3 event types are pre-created for the user as well.
   * Set to the availability the user enter during the onboarding.
   *
   * If a user skips through the Onboarding flow,
   * then the default availability is applied.
   */
  const completeOnboarding = async () => {
    setSubmitting(true);
    if (
      steps[currentStep] &&
      steps[currentStep].onComplete &&
      typeof steps[currentStep].onComplete === "function"
    ) {
      await steps[currentStep].onComplete!();
    }
    if (!props.eventTypes || props.eventTypes.length === 0) {
      const eventTypes = await getEventTypes();
      if (eventTypes.length === 0) {
        await Promise.all(
          DEFAULT_EVENT_TYPES.map(async (event) => {
            return await createEventType(event);
          })
        );
      }
    }
    await updateUser({
      completedOnboarding: true,
    });

    setSubmitting(false);
    router.push("/event-types");
  };

  const fetchUsername = async (username: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}/api/username`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username.trim() }),
      method: "POST",
      mode: "cors",
    });
    const data = (await response.json()) as ResponseUsernameApi;
    return { response, data };
  };

  // Should update username on user when being redirected from sign up and doing google/saml
  useEffect(() => {
    async function validateAndSave(username: string) {
      const { data } = await fetchUsername(username);

      // Only persist username if its available and not premium
      // premium usernames are saved via stripe webhook
      if (data.available && !data.premium) {
        await updateUser({
          username,
        });
      }
      // Remove it from localStorage
      window.localStorage.removeItem("username");
      return;
    }

    // Looking for username on localStorage
    const username = window.localStorage.getItem("username");
    if (username) {
      validateAndSave(username);
    }
  }, []);

  // const availabilityForm = useForm({ defaultValues: { schedule: DEFAULT_SCHEDULE } });
  const steps = [
    {
      id: t("welcome"),
      title: "Step 1",
      description: t("welcome_instructions"),
      Component: (
        <>
          <Space direction="vertical" style={{ maxWidth: "620px" }}>
            <TopText>Create your Calender URL</TopText>
            <DescriptionText>
              {t("welcome_instructions")}
            </DescriptionText>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 20,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  marginBottom: -10,
                  zIndex: 1,
                  backgroundColor: "white",
                  color: "#3D3935",
                  fontSize: 14,
                  marginLeft: 8,
                  maxWidth: "fit-content",
                }}
              >
                {process.env.NEXT_PUBLIC_WEBSITE_URL}/{" "}
              </Text>
              <Input 
                id="username"
                type="text"
                value={enteredName}
                onChange={(e) => setEnteredName(e.target.value)}
                />
            </div>
            <section className="flex justify-between items-center">
              <TopText>Time Zone</TopText>
              <Text>
                {t("current_time")}:&nbsp;
                <span className="text-black">{dayjs().tz(selectedTimeZone).format("LT")}</span>
              </Text>
            </section>
            
            <TimezoneSelect
              id="timeZone"
              value={selectedTimeZone}
              onChange={({ value }) => setSelectedTimeZone(value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </Space>
        </>
      ),
      onComplete: async () => {
        mutationComplete = null;
        setError(null);
        const mutationAsync = new Promise((resolve, reject) => {
          mutationComplete = (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(null);
          };
        });

        const userUpdateData = {
          name: enteredName,
          timeZone: selectedTimeZone,
        };

        mutation.mutate(userUpdateData);

        if (mutationComplete) {
          await mutationAsync;
        }
      },
    },
    {
      id: "connect-calendar",
      title: 'Step 2',
      description: 'Connect your personal calendar to sync with your online scheduling system. We need this to know what times are not available for online scheduling.',
      Component: (
        <Space direction="vertical" style={{ maxWidth: "620px" }}>
          <TopText>Let’s connect your calendar</TopText>
          <DescriptionText>
            Connect your personal calendar to sync with your online scheduling system. We need this to know what times are not available for online scheduling.
          </DescriptionText>
          <Divider />
          <ClientSuspense fallback={<Loader />}>
            <CalendarListContainer heading={false} />
          </ClientSuspense>
        </Space>
      ),
      hideConfirm: true,
      confirmText: t("continue"),
      showCancel: true,
      cancelText: t("continue_without_calendar"),
    },
    {
      id: "set-availability",
      title: "Step 3",
      description: t("set_availability_instructions"),
      Component: (
        <Space direction="vertical" style={{ maxWidth: "620px" }}>
          <TopText>Set you availability</TopText>
          <DescriptionText>
            Select your general availability. Don’t worry, you can customize your
            availability in a future step.
          </DescriptionText>
          <Divider />
          <TopText>Available Hours</TopText>
          <div
            // align="space-between"
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Space style={{ width: "100%" }} direction="vertical">
              <DayText>From</DayText>
              <Select
                style={{ width: "90%" }}
                value={scheduleStart}
                onChange={(value: any) => setScheduleStart(value)}
              >
                {timeOption.map((item, index) => (
                  <Option key={index} value={item.value}>
                    {item.text}
                  </Option>
                ))}
              </Select>
            </Space>
            <Space style={{ width: "100%" }} direction="vertical">
              <DayText>To</DayText>

              <Select
                style={{ width: "90%" }}
                value={scheduleEnd}
                onChange={(value: any) => setScheduleEnd(value)}
              >
                {timeOption.map((item, index) => (
                  <Option key={index} value={item.value}>
                    {item.text}
                  </Option>
                ))}
              </Select>
            </Space>
          </div>
          <TopText>Available Days</TopText>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Checkbox checked={availableSun} onChange={(e: any) => setAvailableSun(e.target.checked) }>
              <DayText>Sunday</DayText>
            </Checkbox>
            <Checkbox checked={availableMon} onChange={(e: any) => setAvailableMon(e.target.checked) }>
              <DayText>Monday</DayText>
            </Checkbox>
            <Checkbox checked={availableTue} onChange={(e: any) => setAvailableTue(e.target.checked) }>
              <DayText>Tuesday</DayText>
            </Checkbox>
            <Checkbox checked={availableWed} onChange={(e: any) => setAvailableWed(e.target.checked) }>
              <DayText>Wednesday</DayText>
            </Checkbox>
          </div>
          <div
            style={{
              width: "65%",
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Checkbox checked={availableThu} onChange={(e: any) => setAvailableThu(e.target.checked) }>
              <DayText>Thursday</DayText>
            </Checkbox>
            <Checkbox checked={availableFri} onChange={(e: any) => setAvailableFri(e.target.checked) }>
              <DayText>Friday</DayText>
            </Checkbox>
            <Checkbox checked={availableSat} onChange={(e: any) => setAvailableSat(e.target.checked) }>
              <DayText>Saturday</DayText>
            </Checkbox>
          </div>
        </Space>
      ),
      hideConfirm: true,
      showCancel: false,
      onComplete: async () => {
        try {
          setSubmitting(true);
          let schedule:ScheduleType = [];
          if(availableSun) {
            schedule.push([{
              start: new Date(new Date().setUTCHours(scheduleStart, 0, 0, 0)),
              end: new Date(new Date().setUTCHours(scheduleEnd, 0, 0, 0)),
            }]);
          } else {
            schedule.push([]);
          }
          if(availableMon) {
            schedule.push([{
              start: new Date(new Date().setUTCHours(scheduleStart, 0, 0, 0)),
              end: new Date(new Date().setUTCHours(scheduleEnd, 0, 0, 0)),
            }]);
          } else {
            schedule.push([]);
          }
          if(availableTue) {
            schedule.push([{
              start: new Date(new Date().setUTCHours(scheduleStart, 0, 0, 0)),
              end: new Date(new Date().setUTCHours(scheduleEnd, 0, 0, 0)),
            }]);
          } else {
            schedule.push([]);
          }
          if(availableWed) {
            schedule.push([{
              start: new Date(new Date().setUTCHours(scheduleStart, 0, 0, 0)),
              end: new Date(new Date().setUTCHours(scheduleEnd, 0, 0, 0)),
            }]);
          } else {
            schedule.push([]);
          }
          if(availableThu) {
            schedule.push([{
              start: new Date(new Date().setUTCHours(scheduleStart, 0, 0, 0)),
              end: new Date(new Date().setUTCHours(scheduleEnd, 0, 0, 0)),
            }]);
          } else {
            schedule.push([]);
          }
          if(availableFri) {
            schedule.push([{
              start: new Date(new Date().setUTCHours(scheduleStart, 0, 0, 0)),
              end: new Date(new Date().setUTCHours(scheduleEnd, 0, 0, 0)),
            }]);
          } else {
            schedule.push([]);
          }
          if(availableSat) {
            schedule.push([{
              start: new Date(new Date().setUTCHours(scheduleStart, 0, 0, 0)),
              end: new Date(new Date().setUTCHours(scheduleEnd, 0, 0, 0)),
            }]);
          } else {
            schedule.push([]);
          }
          await createSchedule.mutate({
            name: t("default_schedule_name"),
            ...{schedule: schedule},
          });
          setSubmitting(false);
        } catch (error) {
          if (error instanceof Error) {
            setError(error);
          }
        }
      },
    }
  ];
  /** End Onboarding Steps */

  useEffect(() => {
    detectStep();
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !ready) {
    return <div className="loader"></div>;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <StyledHeader>
        <Image src={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/custom/logocountry.svg`} />
        <div style={{ display: "flex" }}>
          <AccountButton>
            {/* <Menu style={{}}> */}
            <Menu.SubMenu
              style={{ borderWidth: 0, borderColor: "gray" }}
              key="SubMenu"
              title="Account"
              // icon={<SettingOutlined />}
            >
              {/* <Menu.ItemGroup title="Item 1"> */}
              <Menu.Item key="app" icon={<UserOutlined />}>
                User Name
              </Menu.Item>
              {/* <Menu.Item
                // onClick={() => navigate("/profile")}
                key="viewProfile"
              >
                View Profile
              </Menu.Item> */}
              <Menu.Item key="integra">Integration</Menu.Item>
              <Menu.Item key="support">Support</Menu.Item>
              {/* <Menu.Item onClick={() => dispatch(logOut())} key="logout">
                Log Out
              </Menu.Item> */}
            </Menu.SubMenu>
            {/* </Menu> */}
          </AccountButton>{" "}
        </div>
      </StyledHeader>

      <Content
        style={{
          padding: "0 20px",
          display: "flex",
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <WelcomeText>Welcome{ props.user.name ? ` ,${props.user.name}`:`` }</WelcomeText>
          <Text>Let’s help you setup.</Text>
          
          <Steps style={{ margin: 20 }} current={currentStep}>
            {steps.map((item) => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
          <StyledCard>
            {/* <div className="steps-content">{steps[currentStep].content}</div> */}
            {steps[currentStep].Component}
            <div
              className="steps-action"
              style={{
                marginTop: '10px',
                display: "flex",
                justifyContent: currentStep > 0 ? "space-between" : "flex-end",
              }}
            >
              {currentStep > 0 && (
                <Button
                  type="primary"
                  // color="primary"
                  style={{ margin: "0 8px" }}
                  onClick={() => decrementStep()}
                >
                  Back
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={() => handleConfirmStep()}>
                  Next
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button
                  type="primary"
                  onClick={() => completeOnboarding()}
                >
                  Finish
                </Button>
              )}
            </div>
          </StyledCard>
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        Powered by The Hypo Group
      </Footer>
    </Layout>
  );
}

const HelpText = styled(Text)`
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;

  color: #3d3935;

  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 0px 8px;
`;

const AccountButton = styled(Menu)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 18px;
  position: static;
  margin-left: 10px;
  /* margin-right: 10px; */
  /* background: #ffffff; */
  border: 1px solid #005c3e;
  /* box-sizing: border-box; */
  /* box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05); */
  border-radius: 8px;
  height: 33px;
`;

const HelpButton = styled(Button)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 18px;
  position: static;
  margin-left: 10px;
  /* margin-right: 10px; */
  /* background: #ffffff; */
  /* border: 1px solid #005c3e; */
  /* box-sizing: border-box; */
  /* box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05); */
  border-radius: 8px;
`;

const StyledHeader = styled(Header)`
  background: #fff;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24px 112px;
  background: #ffffff;
  width: 100%;
  position: static;
  height: 92px;
  box-shadow: 0px 1px 3px rgba(16, 24, 40, 0.1),
    0px 1px 2px rgba(16, 24, 40, 0.06);
  justify-content: space-between;
  align-items: center;
`;


const SmallText = styled(Text)`
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 16px;
  /* identical to box height, or 143% */

  text-align: center;

  /* Light Text */

  color: #736b63;
`;

const WelcomeText = styled(Text)`
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 30px;

  /* identical to box height, or 150% */

  text-align: center;

  /* Primary Color */

  color: #005c3e;
`;

export const TopText = styled(Text)`
  font-weight: 700;
  font-size: 18px;
  line-height: 28px;
  color: #3d3935;
  flex: none;
  order: 0;
  align-self: stretch;
  flex-grow: 0;
  margin: 4px 0px;
`;

export const DescriptionText = styled(Text)`
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #736b63;
  flex: none;
  order: 1;
  align-self: stretch;
  flex-grow: 0;
  margin: 4px 0px;
`;

const DayText = styled(Typography.Text)`
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: #3d3935;
`;

const timeOption = [
  {value: 0, text: "12:00 AM"},
  {value: 1, text: "01:00 AM"},
  {value: 2, text: "02:00 AM"},
  {value: 3, text: "03:00 AM"},
  {value: 4, text: "04:00 AM"},
  {value: 5, text: "05:00 AM"},
  {value: 6, text: "06:00 AM"},
  {value: 7, text: "07:00 AM"},
  {value: 8, text: "08:00 AM"},
  {value: 9, text: "09:00 AM"},
  {value: 10, text: "10:00 AM"},
  {value: 11, text: "11:00 AM"},
  {value: 12, text: "12:00 PM"},
  {value: 13, text: "01:00 PM"},
  {value: 14, text: "02:00 PM"},
  {value: 15, text: "03:00 PM"},
  {value: 16, text: "04:00 PM"},
  {value: 17, text: "05:00 PM"},
  {value: 18, text: "06:00 PM"},
  {value: 19, text: "07:00 PM"},
  {value: 20, text: "08:00 PM"},
  {value: 21, text: "09:00 PM"},
  {value: 22, text: "10:00 PM"},
  {value: 23, text: "11:00 PM"},
];

export async function getServerSideProps(context: NextPageContext) {
  const session = await getSession(context);

  if (!session?.user?.id) {
    return {
      redirect: {
        permanent: false,
        destination: "/auth/login",
      },
    };
  }
  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      username: true,
      name: true,
      email: true,
      bio: true,
      avatar: true,
      timeZone: true,
      identityProvider: true,
      completedOnboarding: true,
      selectedCalendars: {
        select: {
          externalId: true,
          integration: true,
        },
      },
    },
  });
  if (!user) {
    throw new Error(`Signed in as ${session.user.id} but cannot be found in db`);
  }

  if (user.completedOnboarding) {
    return {
      redirect: {
        permanent: false,
        destination: "/event-types",
      },
    };
  }

  const credentials = await prisma.credential.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      type: true,
      key: true,
      userId: true,
    },
  });

  const integrations = getApps(credentials)
    .filter((item) => item.type.endsWith("_calendar"))
    .map((item) => omit(item, "key"));

  // get user's credentials + their connected integrations
  const calendarCredentials = getCalendarCredentials(credentials, user.id);
  // get all the connected integrations' calendars (from third party)
  const connectedCalendars = await getConnectedCalendars(calendarCredentials, user.selectedCalendars);

  const eventTypes = await prisma.eventType.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      length: true,
      hidden: true,
    },
  });

  const schedules = await prisma.schedule.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  return {
    props: {
      session,
      user,
      integrations,
      connectedCalendars,
      eventTypes,
      schedules,
    },
  };
}
