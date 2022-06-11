import React, { useState } from "react";
import {
  Modal,
  Button,
  Input,
  Typography,
  Switch,
  Space,
  Checkbox,
  Select,
  Divider,
} from "antd";
import {
  TopText,
  DescriptionText,
  DescriptionTextFixed,
} from "@components/StyledTypography";
import { RightOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;
const CalendarTypeModal = ({ eventPeriodCountCalendarDays, isModalVisible, handleOk, handleCancel }: any) => {
  const [periodCountCalendarDays, setEventPeriodCountCalendarDays] = React.useState(eventPeriodCountCalendarDays);
  return (
    <>
      <Modal
        title={
          <TopText style={{ color: "#005C3E" }}>Select Date Range</TopText>
        }
        visible={isModalVisible}
        onOk={() => handleOk(periodCountCalendarDays)}
        onCancel={handleCancel}
        okText="Apply"
      >
        <Space 
          style={{cursor: 'pointer', width: '100%', padding: '0 10px', border: periodCountCalendarDays == 1 ? '1px solid #E4E4E4': 'none'}}
          size={"small"} 
          direction="vertical" 
          onClick={() => setEventPeriodCountCalendarDays(1)}
        >
          <TopText>Calendar Days</TopText>

          <DescriptionText>
            Count every day on the calendar including days you're unavailable
          </DescriptionText>
          <RightOutlined
            style={{ position: "absolute", right: 30, marginTop: -40 }}
          />
        </Space>
        <Divider style={{margin: '5px 0'}} />
        <Space 
          style={{cursor: 'pointer', width: '100%', padding: '0 10px', border: periodCountCalendarDays == 0 ? '1px solid #E4E4E4': 'none'}}
          size={"small"} 
          direction="vertical" 
          onClick={() => setEventPeriodCountCalendarDays(0)}
        >
          <TopText>Business days</TopText>

          <DescriptionText>
            Excludes weekends and only counts Mon - Fri
          </DescriptionText>
          <RightOutlined
            style={{ position: "absolute", right: 30, marginTop: -40 }}
          />
        </Space>
        <Divider />
      </Modal>
    </>
  );
};

export default CalendarTypeModal;
