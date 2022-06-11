import { Typography, Button } from "antd";
import styled from "styled-components";
const { Text } = Typography;
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
  font-family: "Source Sans Pro";
`;

export const DescriptionText = styled(Text)`
  font-family: "Source Sans Pro";
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #736b63;
  flex: none;
  order: 1;
  align-self: stretch;
  flex-grow: 0;
  /* margin: 4px 0px; */
`;
export const DescriptionTextFixed = styled(Text)`
  font-family: "Source Sans Pro";
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;

  /* padding-right: 10px; */
  color: #736b63;
  flex: none;
  order: 1;
  align-self: stretch;
  flex-grow: 0;
  /* max-width: 90px; */
  /* margin: 4px 0px; */
`;
