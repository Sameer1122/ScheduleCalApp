import React, { useState } from "react";
import {
	Modal,
	Input,
} from "antd";

import { LocationType } from "@lib/location";
import { useLocale } from "@calcom/lib/hooks/useLocale";

const LocationDetailModal = ({ locationType, locationAddress, locationLink, setLocationAddress, setLocationLink, showLocationModal, handleOk, handleCancel }: any) => {
	const { t } = useLocale();

	const LocationOptions = () => {
		switch (locationType) {
			case LocationType.InPerson:
				return (
					<div>
						<label className="block text-sm font-medium text-gray-700">
							{t("set_address_place")}
						</label>
						<div className="mt-1">
							<Input
								type="text"								
								required
								className=" block w-full rounded-sm border-gray-300 text-sm shadow-sm"
								onChange={(e: any) => setLocationAddress(e.target.value)}
								value={locationAddress || ''}
							/>
						</div>
					</div>
				);
			case LocationType.Link:
				return (
					<div>
						<label className="block text-sm font-medium text-gray-700">
							{t("set_link_meeting")}
						</label>
						<div className="mt-1">
							<Input
								type="text"								
								required
								className="block w-full rounded-sm border-gray-300 shadow-sm sm:text-sm"
								onChange={(e: any) => setLocationLink(e.target.value)}
								value={locationLink || ''}
							/>
						</div>
					</div>
				);
			case LocationType.Phone:
				return <p className="text-sm">{t("cal_invitee_phone_number_scheduling")}</p>;
			/* TODO: Render this dynamically from App Store */
			case LocationType.GoogleMeet:
				return <p className="text-sm">{t("cal_provide_google_meet_location")}</p>;
			case LocationType.Zoom:
				return <p className="text-sm">{t("cal_provide_zoom_meeting_url")}</p>;
			case LocationType.Daily:
				return <p className="text-sm">{t("cal_provide_video_meeting_url")}</p>;
			case LocationType.Jitsi:
				return <p className="text-sm">{t("cal_provide_jitsi_meeting_url")}</p>;
			case LocationType.Huddle01:
				return <p className="text-sm">{t("cal_provide_huddle01_meeting_url")}</p>;
			case LocationType.Tandem:
				return <p className="text-sm">{t("cal_provide_tandem_meeting_url")}</p>;
			case LocationType.Teams:
				return <p className="text-sm">{t("cal_provide_teams_meeting_url")}</p>;
			default:
				return null;
		}
	};
	return (
		<>
			<Modal
				visible={showLocationModal}
				onOk={handleOk()}
				onCancel={handleCancel()}
				okText="Apply"
			>
				{LocationOptions()}
			</Modal>
		</>
	);
};

export default LocationDetailModal;
