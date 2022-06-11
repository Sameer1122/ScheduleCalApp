import React from "react";
import {
  Steps,
  Button,
  message,
  Input,
  Typography,
  Space,
  Row,
  Col,
} from "antd";
import styled from "styled-components";
import {
  TopText,
  DescriptionText,
} from "@components/StyledTypography";
import CheckCircleOutlined from "@ant-design/icons/CheckCircleOutlined";

const { Text } = Typography;

const CreateEventType = ({ eventType, setEventType }:any) => {
  return (
    <Space direction="vertical" className="w-full">
      <TopText>Select Event Type</TopText>
      <DescriptionText>
        Select which type of event you want to allow your clients to schedule.
      </DescriptionText>

      <Space
        style={{
          width: "100%",
          padding: 10,
          border: eventType === 0 ? "1px solid #005C3E" : "1px solid #EDEDED",
          borderRadius: "4px",
          boxShadow:
            " 0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)",
					cursor: "pointer"
        }}
        align="center"
        direction="horizontal"
        onClick={() => setEventType(0)}
      >
        {" "}
        <div
          style={{
            width: 40,
            display: "flex",
            justifyContent: "center",
            // justifyItems: "center",
          }}
        >
          {eventType === 0 && (
            <CheckCircleOutlined
              style={{
                color: "#005C3E",
                alignSelf: "center",
                fontSize: "20px",
                justifySelf: "center",
              }}
            />
          )}
        </div>
        <Space direction="vertical">
          <TopText>Both</TopText>
          <DescriptionText>
            Client can choose between an in person meeting or a virtual meeting
            with this event.
          </DescriptionText>
        </Space>
      </Space>
      <Space
        onClick={() => {
          setEventType(1);
        }}
        style={{
          marginTop: 20,
          marginBottom: 20,
          padding: 10,
          width: "100%",
          border: eventType === 1 ? "1px solid #005C3E" : "1px solid #EDEDED",
          borderRadius: "4px",
          boxShadow:
            " 0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)",
					cursor: "pointer"
        }}
        align="center"
        direction="horizontal"
      >
        <div
          style={{
            width: 40,
            display: "flex",
            justifyContent: "center",
            // justifyItems: "center",
          }}
        >
          {eventType === 1 && (
            <CheckCircleOutlined
              style={{
                color: "#005C3E",
                alignSelf: "center",
                fontSize: "20px",
                justifySelf: "center",
              }}
            />
          )}
        </div>
        <Space direction="vertical">
          <TopText>In Person Meeting</TopText>
          <DescriptionText>
            Only allow clients to book in person meetings for this event.
          </DescriptionText>
        </Space>
      </Space>
      <Space
        onClick={() => {
          setEventType(2);
        }}
        style={{
          marginBottom: 20,
          padding: 10,
          width: "100%",
          border: eventType === 2 ? "1px solid #005C3E" : "1px solid #EDEDED",
          borderRadius: "4px",
          boxShadow:
            " 0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)",
					cursor: "pointer"
        }}
        align="center"
        direction="horizontal"
      >
        <div
          style={{
            width: 40,
            display: "flex",
            justifyContent: "center",
            // justifyItems: "center",
            // margin: 20,
          }}
        >
          {eventType === 2 && (
            <CheckCircleOutlined
              style={{
                color: "#005C3E",
                alignSelf: "center",
                fontSize: "20px",
                justifySelf: "center",
              }}
            />
          )}
        </div>
        <Space direction="vertical">
          <TopText>Virtual Meeting</TopText>
          <DescriptionText>
            Only allow clients to book virtual meetings for this event.
          </DescriptionText>
        </Space>
      </Space>
    </Space>
  );
};

export default CreateEventType;
