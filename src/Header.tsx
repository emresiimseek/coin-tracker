import { memo } from "react";

const Header = ({
  onChange,
  principal = "",
}: {
  onChange: (value: number) => void;
  principal: string;
}) => {
  return (
    <>
      <div style={{ padding: 5 }}>
        <label htmlFor="principal" style={{ marginRight: 5 }}>
          Ana Para
        </label>
        <input
          id="principal"
          type="number"
          value={+principal}
          onChange={(event) => onChange(+event.target.value)}
        />
      </div>
    </>
  );
};

export default memo(Header);
