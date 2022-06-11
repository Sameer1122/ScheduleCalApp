import React from "react";
import { trpc } from "@lib/trpc";
import { TopText, DescriptionText } from "@components/StyledTypography";
import styled from "styled-components";
import {
	Avatar,
	Button,
	Space,
	Typography,
	Input,
	Select,
	DatePicker,
} from "antd";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

export const options = {
	plugins: {
		title: {
			display: false,
			text: "",
		},
	},
	responsive: true,

	scales: {
		x: {
			stacked: true,
		},
		y: {
			stacked: true,
		},
	},
};

const labels = [
	"2/4",
	"3/7",
	"1/7",
	"0/9",
	"2/6",
	"3/7",
	"1/9",
	"2/11",
	"1/6",
	"3/8",
];

export const data = {
	labels,
	datasets: [
		{
			label: "Confirmed Booking",
			data: [4, 7, 7, 9, 6, 7, 9, 9, 6, 8],
			backgroundColor: "rgba(0, 92, 62, 1)",
		},
		{
			label: "Cancelled Booking",
			data: [2, 3, 1, 0, 2, 3, 1, 2, 1, 3],
			backgroundColor: "rgba(0, 122, 62, 1)",
		},
	],
};
const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const Report = () => {
	return false ? (
		<StyledContainer>
			<TopText style={{ textAlign: "center" }}>There is no report!</TopText>
			<DescriptionText style={{ textAlign: "center" }}>
				Your report will show here.
			</DescriptionText>
		</StyledContainer>
	) : (
		<div
			style={{
				marginTop: 20,
				marginLeft: 40,
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<Space size={"large"}>
					<StyledCard>
						<TitleText>10</TitleText>
						<SmallText>Confirmed Appointments</SmallText>
					</StyledCard>
					<StyledCard style={{ width: 251 }}>
						<TitleText>10</TitleText>
						<SmallText>Cancelled Appointments</SmallText>
					</StyledCard>
				</Space>
				<RangePicker
					// placeholder="Select dates"
					style={{ height: 30 }}
					size="small"
				/>
			</div>
			<div style={{ width: "65%", marginTop: 80, height: "50%" }}>
				<Bar options={options} data={data} />
			</div>
		</div>
	);
};

const TitleText = styled(Text)`
  font-family: "Source Sans Pro";
  font-style: normal;
  font-weight: 700;
  font-size: 40px;
  line-height: 24px;
  /* identical to box height, or 60% */

  text-align: center;

  /* Secondary Color */

  color: #007a3e;

  /* Inside auto layout */

  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 24px 0px;
`;
const SmallText = styled(Text)`
  font-family: "Source Sans Pro";
  font-style: normal;
  font-weight: 700;
  font-size: 24px;
  line-height: 24px;
  /* or 100% */

  text-align: center;

  /* Text Gray */

  color: #3d3935;

  /* Inside auto layout */
`;
const StyledCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;

  width: 281px;
  /* height: 160px; */

  /* White Color */

  background: #ffffff;

  /* Inside auto layout */
`;
const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  /* align-items: center; */
  /* align-content: center; */
  padding: 40px;
  border: 1px dashed #736b63;
  /* width: 80vw; */
  height: 60vh;

  /* background: #ffffff; */
  /* 
  box-shadow: 0px 4px 8px -2px rgba(16, 24, 40, 0.1),
    0px 2px 4px -2px rgba(16, 24, 40, 0.06); */
`;
export default Report;
