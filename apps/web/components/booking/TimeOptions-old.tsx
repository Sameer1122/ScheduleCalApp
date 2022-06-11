import { FC, useEffect, useState } from "react";
import TimezoneSelect, { ITimezoneOption } from "react-timezone-select";

import Switch from "@calcom/ui/Switch";

import { useLocale } from "@lib/hooks/useLocale";

import { is24h, timeZone } from "../../lib/clock";

type Props = {
  onSelectTimeZone: (selectedTimeZone: string) => void;
  onToggle24hClock: (is24hClock: boolean) => void;
};

const TimeOptions: FC<Props> = ({ onToggle24hClock, onSelectTimeZone }) => {
  const [selectedTimeZone, setSelectedTimeZone] = useState("");
  const [is24hClock, setIs24hClock] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    setIs24hClock(is24h());
    setSelectedTimeZone(timeZone());
  }, []);

  useEffect(() => {
    if (selectedTimeZone && timeZone() && selectedTimeZone !== timeZone()) {
      onSelectTimeZone(timeZone(selectedTimeZone));
    }
  }, [selectedTimeZone, onSelectTimeZone]);
  const handle24hClockToggle = (is24hClock: boolean) => {
    setIs24hClock(is24hClock);
    onToggle24hClock(is24h(is24hClock));
  };

  return selectedTimeZone !== "" ? (
    <div className="max-w-80 absolute z-10 w-full rounded-sm border border-gray-200 bg-white px-4 py-2 dark:border-0 dark:bg-gray-700">
      <div className="mb-4 flex">
        <div className="font-medium text-gray-600 dark:text-white">{t("time_options")}</div>
        <div className="ml-auto flex items-center">
          <label className="ltl:mr-3 mr-2 align-text-top text-sm font-medium text-neutral-700 ltr:ml-3 rtl:mr-3 dark:text-white">
            {t("am_pm")}
          </label>
          <Switch
            name="24hClock"
            label={t("24_h")}
            defaultChecked={is24hClock}
            onCheckedChange={handle24hClockToggle}
          />
        </div>
      </div>
      <TimezoneSelect
        id="timeZone"
        value={selectedTimeZone}
        onChange={(tz: ITimezoneOption) => setSelectedTimeZone(tz.value)}
        className="focus:border-brand mt-1 mb-2 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black sm:text-sm"
      />
    </div>
  ) : null;
};

export default TimeOptions;
