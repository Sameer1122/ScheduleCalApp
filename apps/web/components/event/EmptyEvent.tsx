import React from "react";
import { Button, Typography } from "antd";
import styled from "styled-components";
import Link from "next/link";

const EmptyEvent = () => {
	return (
		<div>
			<StyledContainer>
				<StyledText>New Event</StyledText>
				<StyledInnerText>
					Click on the button below to create a new event for
					instant-scheduling.
				</StyledInnerText>
				<Link href="/event-types/create">
					<StyledButton type="primary">
						New Event
					</StyledButton>
				</Link>
			</StyledContainer>
		</div>
	);
};

const StyledContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    border: 4px dashed rgba(115, 107, 99, 0.5);
    border-radius: 8px;
    width: 300px;
    height: 224px;
  `;
const StyledText = styled(Typography.Text)`
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 28px;
    color: #3d3935;
    margin-bottom: 10px;
  `;
const StyledInnerText = styled(Typography.Text)`
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    max-width: 220px;
    text-align: center;
    color: #736b63;
    margin-bottom: 20px;
  `;
const StyledButton = styled(Button)`
    width: 107px;
    height: 44px;
    border-radius: 8px;
  `;
export default EmptyEvent;
