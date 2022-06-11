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
import { RightOutlined, CloseCircleOutlined } from "@ant-design/icons";
const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Option } = Select;
const BookingCancel = ({ isModalVisible, handleOk, handleCancel } : any) => {
  return (
    <>
      <Modal
        title={<CloseCircleOutlined />}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Yes"
        cancelText="No"
      >
        <Space direction="vertical">
          <TopText>Do you want to cancel the booking?</TopText>
          <DescriptionText>We will notfify the client</DescriptionText>
        </Space>
      </Modal>
    </>
  );
};

export default BookingCancel;
