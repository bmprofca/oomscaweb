import Select from "react-select";
import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { getReactSelectMenuProps, getReactSelectStyles } from "../../hooks/reactSelectConfig";

const mergeSelectStyles = (baseStyles, styles = {}, theme = 'light') => {
  const customStyles = styles || {};
  const keys = new Set([...Object.keys(baseStyles), ...Object.keys(customStyles)]);

  const merged = {};
  keys.forEach((key) => {
    const baseStyle = baseStyles[key];
    const overrideStyle = customStyles[key];

    if (baseStyle && overrideStyle) {
      merged[key] = (provided, state) => overrideStyle(baseStyle(provided, state), state, theme);
    } else {
      merged[key] = overrideStyle || baseStyle;
    }
  });

  return merged;
};

/** Shows "First label +N" instead of every selected chip. */
const CompactMultiValue = ({ index, data, removeProps, innerProps, selectProps }) => {
  if (index > 0) return null;

  const values = Array.isArray(selectProps?.value) ? selectProps.value : [];
  const extra = Math.max(0, values.length - 1);
  const label = data?.label || values[0]?.label || '';

  return (
    <div
      {...innerProps}
      className="ooms-select__multi-value flex max-w-full items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-slate-800 dark:text-indigo-200"
    >
      <span className="truncate">
        {extra > 0 ? `${label} +${extra}` : label}
      </span>
      <span
        {...removeProps}
        role="button"
        tabIndex={-1}
        aria-label="Clear selection"
        className="cursor-pointer leading-none opacity-60 hover:opacity-100"
      >
        ×
      </span>
    </div>
  );
};

const SelectField = ({ styles, compactMulti = false, components: userComponents, ...props }) => {
  const { theme } = useTheme();
  const mergedStyles = useMemo(
    () => mergeSelectStyles(getReactSelectStyles(theme), styles, theme),
    [theme, styles]
  );

  const selectComponents = useMemo(() => {
    if (!compactMulti) return userComponents;
    return {
      MultiValue: CompactMultiValue,
      ...(userComponents || {}),
    };
  }, [compactMulti, userComponents]);

  return (
    <Select
      key={theme}
      classNamePrefix={props.classNamePrefix || "ooms-select"}
      {...getReactSelectMenuProps()}
      {...props}
      components={selectComponents}
      styles={mergedStyles}
    />
  );
};

export default SelectField;
