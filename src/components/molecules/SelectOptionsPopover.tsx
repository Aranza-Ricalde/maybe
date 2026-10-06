import { ListBox, Select } from "@heroui/react";

export interface SelectOptionItem {
  id: string | number;
  label: string;
}

export function SelectOptionsPopover({ options }: { options: SelectOptionItem[] }) {
  return (
    <Select.Popover className="max-h-60">
      <ListBox items={options}>{(option) => <ListBox.Item id={option.id}>{option.label}</ListBox.Item>}</ListBox>
    </Select.Popover>
  );
}
