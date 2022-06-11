import { useContracts } from "contexts/contractsContext";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import { useEmbedStyles, useIsEmbed, useIsBackgroundTransparent, sdkActionManager } from "@calcom/embed-core";
import { useLocale } from "@calcom/lib/hooks/useLocale";

import { BASE_URL } from "@lib/config/constants";
import { useExposePlanGlobally } from "@lib/hooks/useExposePlanGlobally";
import useTheme from "@lib/hooks/useTheme";

import { HeadSeo } from "@components/seo/head-seo";
import AvatarGroup from "@components/ui/AvatarGroup";
import {
  Space,
  Steps,
  message,
  Button,
  Typography,
  Avatar,
  Row,
  Col,
} from "antd";
import styled from "styled-components";
import { TopText, DescriptionText } from "../../../components/StyledTypography";
import ClockCircleOutlined from "@ant-design/icons/ClockCircleOutlined";
import { RightOutlined } from "@ant-design/icons";

import { MeetingTypePageProps } from "../../../pages/[user]/[type]";
import { AvailabilityTeamPageProps } from "../../../pages/team/[slug]/[type]";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

type Props = AvailabilityTeamPageProps | MeetingTypePageProps;

const StyledCard = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
  margin: 30px;
  width: 940px;
  background: #ffffff;
  box-shadow: 0px 4px 8px -2px rgba(16, 24, 40, 0.1),
    0px 2px 4px -2px rgba(16, 24, 40, 0.06);
`;

const MeetingTypePage = ({ profile, plan, eventType, workingHours, previousPage, booking }: Props) => {
  const router = useRouter();
  const isEmbed = useIsEmbed();
  const { rescheduleUid } = router.query;
  const { isReady, Theme } = useTheme(profile.theme);
  const { t } = useLocale();
  const { contracts } = useContracts();
  const [current, setCurrent] = useState(0);
  useExposePlanGlobally(plan);
  useEffect(() => {
    if (eventType.metadata.smartContractAddress) {
      const eventOwner = eventType.users[0];
      if (!contracts[(eventType.metadata.smartContractAddress || null) as number])
        router.replace(`/${eventOwner.username}`);
    }
  }, [contracts, eventType.metadata.smartContractAddress, router]);

  const handleNext = () => {
    router.push({
      pathname: "availability",
      query: {
        ...router.query,
        meetingType: current,
        type: eventType.id,
        eventSlug: eventType.slug,
        user: profile.slug,
        reschedule: !!rescheduleUid,
      },
    })
  }

  return (
    <>
      <Theme />
      <HeadSeo
        title={`${rescheduleUid ? t("reschedule") : ""} ${eventType.title} | ${profile.name}`}
        description={`${rescheduleUid ? t("reschedule") : ""} ${eventType.title}`}
        name={profile.name || undefined}
        username={profile.slug || undefined}
        // avatar={profile.image || undefined}
      />
      <StyledCard>
        {isReady && (
          <Row gutter={40}>
            <Col span={12}>
              <Space direction="vertical">
                <Space>
                  {/* <AvatarGroup
                    border="border-2 dark:border-gray-800 border-white"
                    items={
                      [
                        { image: profile.image, alt: profile.name, title: profile.name },
                        ...eventType.users
                          .filter((user) => user.name !== profile.name)
                          .map((user) => ({
                            title: user.name,
                            alt: user.name,
                            image: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${user.username}/avatar.png`,
                          })),
                      ].filter((item) => !!item.image) as { image: string; alt?: string; title?: string }[]
                    }
                    size={10}
                    truncateAfter={3}
                  /> */}
                  <Avatar size={100} src={profile.image} />
                  <TopText style={{ color: "#005C3E", fontSize: 20 }}>
                    {profile.name}
                  </TopText>
                </Space>
                <TopText>{eventType.title}</TopText>
                {eventType?.description && (
                  <DescriptionText>{eventType.description}</DescriptionText>
                )}
                <TopText> Meeting Detail</TopText>
                <Space>
                  <ClockCircleOutlined style={{ color: "#007A3E" }} />
                  <DescriptionText>{eventType.length} {t("minutes")}</DescriptionText>
                </Space>
              </Space>
            </Col>
            <Col span={12}>
              <Space direction="vertical">
                <div className="steps-content">
                  <Space
                    direction="vertical"
                    style={
                      {
                        // maxWidth: "620px",
                      }
                    }
                  >
                    <TopText style={{ paddingBottom: 100 }}>Select meeting type</TopText>
                    <div style={{ height: 70 }} />
                    <DescriptionText>
                      In person or virtual — what's more convenient for you?
                    </DescriptionText>
                    <Space
                      style={{
                        cursor: 'pointer',
                        width: '100%',
                        padding: 5,
                        border: current === 0 ? "1px solid #3d3935" : "none",
                        borderRadius: "4px",
                        boxShadow:
                          " 0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)",
                      }}
                      align="center"
                      direction="horizontal"
                      onClick={() => setCurrent(0)}
                    >
                      <Space
                        style={{
                          padding: 5,
                          // border: current === 0 ? "1px solid #3d3935" : "none",
                          borderRadius: "4px",
                          width: 312,
                        }}
                        direction="vertical"
                      >
                        <TopText>Virtual meeting</TopText>
                        <DescriptionText>
                          Meet virtually on the date and time you select. Get a link to join
                          after you schedule your meeting.
                        </DescriptionText>
                      </Space>
                      <RightOutlined style={{ margin: 20 }} />
                    </Space>
                    <Space
                      style={{
                        cursor: 'pointer',
                        width: '100%',
                        padding: 5,
                        border: current === 1 ? "1px solid #3d3935" : "none",
                        borderRadius: "4px",
                        boxShadow:
                          " 0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)",
                      }}
                      align="center"
                      direction="horizontal"
                      onClick={() => setCurrent(1)}
                    >
                      <Space
                        style={{
                          padding: 5,
                          // border: current === 0 ? "1px solid #3d3935" : "none",
                          borderRadius: "4px",
                          width: 312,
                        }}
                        direction="vertical"
                      >
                        <TopText>In person meeting</TopText>
                        <DescriptionText>
                          Meet in person at Michael’s office in Bloomington, IL on the date
                          and time you select.
                        </DescriptionText>
                      </Space>
                      <RightOutlined style={{ margin: 20 }} />
                    </Space>
                  </Space>
                </div>
                <div
                  className="steps-action"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button type="primary" onClick={() => handleNext()}>
                    Next
                  </Button>
                </div>
              </Space>
            </Col>
          </Row>
        )}
      </StyledCard>
    </>
  );
}
export default MeetingTypePage;
