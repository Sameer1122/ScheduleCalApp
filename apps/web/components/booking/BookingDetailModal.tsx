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
} from "antd";
import {
	TopText,
	DescriptionText,
	DescriptionTextFixed,
} from "@components/StyledTypography";
import { RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;
const BookingDetailModal = ({
	booking,
  isModalVisible,
	handleOk,
	handleCancel
}: any) => {
	return (
		<>
			<Modal
				title={<TopText style={{ color: "#005C3E" }}>{booking.title} Details</TopText>}
				visible={isModalVisible}
				onOk={handleOk}
				onCancel={handleCancel}
				okText="Close"
				cancelText=""
				centered
				footer={[
					<Button onClick={handleCancel} type="primary">
						Close
					</Button>,
				]}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						marginTop: 20,
						width: "100%",
						//   marginBottom: 20,
					}}
				>
					<Text
						style={{
							zIndex: 1,
							backgroundColor: "white",
							color: "#3D3935",
							fontSize: 14,
							marginLeft: 8,
							maxWidth: "fit-content",
							// padding: 3,
							marginBottom: -10,
						}}
					>
						Client Name
					</Text>
					<Input
						value={booking.visitors}
						readOnly
					// placeholder="Please enter cleient name"
					/>
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						marginTop: 20,
						width: "100%",
						//   marginBottom: 20,
					}}
				>
					<Text
						style={{
							zIndex: 1,
							backgroundColor: "white",
							color: "#3D3935",
							fontSize: 14,
							marginLeft: 8,
							maxWidth: "fit-content",
							// padding: 3,
							marginBottom: -10,
						}}
					>
						Email
					</Text>
					<Input value={booking.attendees[0].email} readOnly />
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						marginTop: 20,
						width: "100%",
						//   marginBottom: 20,
					}}
				>
					<Text
						style={{
							zIndex: 1,
							backgroundColor: "white",
							color: "#3D3935",
							fontSize: 14,
							marginLeft: 8,
							maxWidth: "fit-content",
							// padding: 3,
							marginBottom: -10,
						}}
					>
						Location
					</Text>
					<Input value={booking.location} readOnly />
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						marginTop: 20,
						width: "100%",
						//   marginBottom: 20,
					}}
				>
					<Text
						style={{
							zIndex: 1,
							backgroundColor: "white",
							color: "#3D3935",
							fontSize: 14,
							marginLeft: 8,
							maxWidth: "fit-content",
							// padding: 3,
							marginBottom: -10,
						}}
					>
						Invitee Time Zone
					</Text>
					<Input value={booking.attendees[0].timeZone} readOnly />
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						marginTop: 20,
						width: "100%",
						//   marginBottom: 20,
					}}
				>
					<Text
						style={{
							zIndex: 1,
							backgroundColor: "white",
							color: "#3D3935",
							fontSize: 14,
							marginLeft: 8,
							maxWidth: "fit-content",
							// padding: 3,
							marginBottom: -10,
						}}
					>
						Phone number
					</Text>
					<Input value={""} readOnly />
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						marginTop: 20,
						width: "100%",
						//   marginBottom: 20,
					}}
				>
					<Text
						style={{
							zIndex: 1,
							backgroundColor: "white",
							color: "#3D3935",
							fontSize: 14,
							marginLeft: 8,
							maxWidth: "fit-content",
							// padding: 3,
							marginBottom: -10,
						}}
					>
						Leave comment
					</Text>
					<Input value={booking.description} readOnly />
				</div>
			</Modal>
		</>
	);
};

export default BookingDetailModal;
