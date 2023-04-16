import { forwardRef } from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";

interface CustomProps {
  onChange: (event: { target: { value: string } }) => void;
  placeholder?: string;
}

export const NumericFormatCustom = forwardRef<NumericFormatProps, CustomProps>(
  function NumericFormatCustom(props, ref) {
    const { onChange, ...other } = props;

    return (
      <NumericFormat
        {...other}
        prefix={props.placeholder}
        getInputRef={ref}
        onValueChange={(values: any) => {
          onChange({
            target: {
              value: values.value,
            },
          });
        }}
        style={{ paddingRight: 0 }}
        valueIsNumericString
        decimalSeparator=","
        thousandSeparator="."
      />
    );
  }
);
