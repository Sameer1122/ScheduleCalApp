import {
	LocationMarkerIcon,
} from "@heroicons/react/solid";
import { Form } from "@calcom/ui/form/fields";
import { LocationType } from "@lib/location";
import { Controller, Noop, useForm, UseFormReturn } from "react-hook-form";
import Select, { SelectProps } from "@components/ui/form/Select";
import Button from "@calcom/ui/Button";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Dialog, DialogContent, DialogTrigger } from "@calcom/ui/Dialog";

const LocationModal = ({ locationFormMethods, detailsForm, locationOptions, selectedLocation, setSelectedLocation, addLocation, showLocationModal, setShowLocationModal }: any) => {
	const { t } = useLocale();
	const LocationOptions = () => {
		if (!selectedLocation) {
			return null;
		}
		switch (selectedLocation.value) {
			case LocationType.InPerson:
				return (
					<div>
						<label htmlFor="address" className="block text-sm font-medium text-gray-700">
							{t("set_address_place")}
						</label>
						<div className="mt-1">
							<input
								type="text"
								{...locationFormMethods.register("locationAddress")}
								id="address"
								required
								className="  block w-full rounded-sm border-gray-300 text-sm shadow-sm"
								defaultValue={
									detailsForm
										.getFieldValue("eventLocations")
										.find((location: any) => location.type === LocationType.InPerson)?.address
								}
							/>
						</div>
					</div>
				);
			case LocationType.Link:
				return (
					<div>
						<label htmlFor="address" className="block text-sm font-medium text-gray-700">
							{t("set_link_meeting")}
						</label>
						<div className="mt-1">
							<input
								type="text"
								{...locationFormMethods.register("locationLink")}
								id="address"
								required
								className="  block w-full rounded-sm border-gray-300 shadow-sm sm:text-sm"
								defaultValue={
									detailsForm
										.getFieldValue("eventLocations").find((location: any) => location.type === LocationType.Link)
										?.link
								}
							/>
							{locationFormMethods.formState.errors.locationLink && (
								<p className="mt-1 text-red-500">
									{locationFormMethods.formState.errors.locationLink.message}
								</p>
							)}
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
		<Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
			<DialogContent asChild>
				<div className="inline-block transform rounded-sm bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
					<div className="mb-4 sm:flex sm:items-start">
						<div className="bg-secondary-100 mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10">
							<LocationMarkerIcon className="text-primary-600 h-6 w-6" />
						</div>
						<div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
							<h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
								{t("edit_location")}
							</h3>
							<div>
								<p className="text-sm text-gray-400">{t("this_input_will_shown_booking_this_event")}</p>
							</div>
						</div>
					</div>
					<Form
						form={locationFormMethods}
						handleSubmit={async (values) => {
							const newLocation = values.locationType;

							let details = {};
							if (newLocation === LocationType.InPerson) {
								details = { address: values.locationAddress };
							}
							if (newLocation === LocationType.Link) {
								details = { link: values.locationLink };
							}

							addLocation(newLocation, details);
							setShowLocationModal(false);
						}}>
						<Controller
							name="locationType"
							control={locationFormMethods.control}
							render={() => (
								<Select
									maxMenuHeight={100}
									name="location"
									defaultValue={selectedLocation}
									options={locationOptions}
									isSearchable={false}
									className="  my-4 block w-full min-w-0 flex-1 rounded-sm border border-gray-300 sm:text-sm"
									onChange={(val) => {
										if (val) {
											locationFormMethods.setValue("locationType", val.value);
											locationFormMethods.unregister("locationLink");
											locationFormMethods.unregister("locationAddress");
											setSelectedLocation(val);
										}
									}}
								/>
							)}
						/>
						<LocationOptions />
						<div className="mt-4 flex justify-end space-x-2">
							<Button onClick={() => setShowLocationModal(false)} type="button" color="secondary">
								{t("cancel")}
							</Button>
							<Button type="submit">{t("update")}</Button>
						</div>
					</Form>
				</div>
			</DialogContent>
		</Dialog>
	)
};

export default LocationModal;