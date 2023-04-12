import { forwardRef } from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";

interface CustomProps {
  onChange: (event: { target: { value: string } }) => void;
  prefix?: string;
}

export const NumericFormatCustom = forwardRef<NumericFormatProps, CustomProps>(
  function NumericFormatCustom(props, ref) {
    const { onChange, prefix, ...other } = props;

    return (
      <NumericFormat
        {...other}
        prefix={prefix}
        getInputRef={ref}
        onValueChange={(values: any) => {
          onChange({
            target: {
              value: values.value,
            },
          });
        }}
        valueIsNumericString
        decimalSeparator=","
        thousandSeparator="."
      />
    );
  }
);
