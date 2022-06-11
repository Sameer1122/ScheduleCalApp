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
  DatePicker,
} from "antd";
import {
  TopText,
  DescriptionText,
  DescriptionTextFixed,
} from "@components/StyledTypography";
import { RightOutlined } from "@ant-design/icons";
const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Option } = Select;
const DateRangePickerModal = ({ eventPeriodStartDate, eventPeriodEndDate, isModalVisible, handleOk, handleCancel }: any) => {
  const [startDate, setStartDate] = React.useState(eventPeriodStartDate);
  const [endDate, setEndDate] = React.useState(eventPeriodEndDate);
  const handleRangeChange = (dates: any) => {
    setStartDate(dates[0]);
    setEndDate(dates[1]);
  }
  return (
    <>
      <Modal
        title={
          <TopText style={{ color: "#005C3E" }}>
            Select within Date Range
          </TopText>
        }
        visible={isModalVisible}
        onOk={() => handleOk(startDate, endDate)}
        onCancel={handleCancel}
        okText="Apply"
      >
        <RangePicker size="large" style={{ width: "100%" }} value={[startDate, endDate]} onChange={handleRangeChange} />
      </Modal>
    </>
  );
};

export default DateRangePickerModal;
