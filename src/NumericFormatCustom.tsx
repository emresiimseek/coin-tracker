import { forwardRef } from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";

interface CustomProps {
  onChange: (event: { target: { value: string } }) => void;
}

export const NumericFormatCustom = forwardRef<NumericFormatProps, CustomProps>(
  function NumericFormatCustom(props, ref) {
    const { onChange, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values: any) => {
          console.log(values);

          onChange({
            target: {
              value: values.value,
            },
          });
        }}
        thousandSeparator
        valueIsNumericString
        prefix="₺"
      />
    );
  }
);
