import classNames from "classnames";
import { components } from "react-select";
import BaseSelect, { ITimezone, Props as SelectProps } from "react-timezone-select";

import { InputComponent } from "@components/ui/form/Select";

function TimezoneSelect({ className, ...props }: SelectProps) {
  return (
    <BaseSelect
      theme={(theme) => ({
        ...theme,
        borderRadius: 2,
        colors: {
          ...theme.colors,
          primary: "var(--brand-color)",

          primary50: "rgba(209 , 213, 219, var(--tw-bg-opacity))",
          primary25: "rgba(244, 245, 246, var(--tw-bg-opacity))",
        },
      })}
      styles={{
        option: (provided, state) => ({
          ...provided,
          color: state.isSelected ? "var(--brand-text-color)" : "black",
          ":active": {
            backgroundColor: state.isSelected ? "" : "var(--brand-color)",
            color: "var(--brand-text-color)",
          },
        }),
      }}
      components={{
        ...components,
        IndicatorSeparator: () => null,
        Input: InputComponent,
      }}
      className={classNames("text-sm shadow-sm", className)}
      {...props}
    />
  );
}

export default TimezoneSelect;
export type { ITimezone };
