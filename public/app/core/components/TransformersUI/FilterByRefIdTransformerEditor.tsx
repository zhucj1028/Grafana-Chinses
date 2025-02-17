import React from 'react';
import {
  DataTransformerID,
  KeyValue,
  standardTransformers,
  TransformerRegistyItem,
  TransformerUIProps,
} from '@grafana/data';
import { HorizontalGroup, FilterPill } from '@grafana/ui';

import { FilterFramesByRefIdTransformerOptions } from '@grafana/data/src/transformations/transformers/filterByRefId';

interface FilterByRefIdTransformerEditorProps extends TransformerUIProps<FilterFramesByRefIdTransformerOptions> {}

interface FilterByRefIdTransformerEditorState {
  include: string;
  options: RefIdInfo[];
  selected: string[];
}

interface RefIdInfo {
  refId: string;
  count: number;
}
export class FilterByRefIdTransformerEditor extends React.PureComponent<
  FilterByRefIdTransformerEditorProps,
  FilterByRefIdTransformerEditorState
> {
  constructor(props: FilterByRefIdTransformerEditorProps) {
    super(props);
    this.state = {
      include: props.options.include || '',
      options: [],
      selected: [],
    };
  }

  componentDidMount() {
    this.initOptions();
  }

  componentDidUpdate(oldProps: FilterByRefIdTransformerEditorProps) {
    if (this.props.input !== oldProps.input) {
      this.initOptions();
    }
  }

  private initOptions() {
    const { input, options } = this.props;
    const configuredOptions = options.include ? options.include.split('|') : [];

    const allNames: RefIdInfo[] = [];
    const byName: KeyValue<RefIdInfo> = {};
    for (const frame of input) {
      if (frame.refId) {
        let v = byName[frame.refId];
        if (!v) {
          v = byName[frame.refId] = {
            refId: frame.refId,
            count: 0,
          };
          allNames.push(v);
        }
        v.count++;
      }
    }

    if (configuredOptions.length) {
      const options: RefIdInfo[] = [];
      const selected: RefIdInfo[] = [];
      for (const v of allNames) {
        if (configuredOptions.includes(v.refId)) {
          selected.push(v);
        }
        options.push(v);
      }

      this.setState({
        options,
        selected: selected.map(s => s.refId),
      });
    } else {
      this.setState({ options: allNames, selected: [] });
    }
  }

  onFieldToggle = (fieldName: string) => {
    const { selected } = this.state;
    if (selected.indexOf(fieldName) > -1) {
      this.onChange(selected.filter(s => s !== fieldName));
    } else {
      this.onChange([...selected, fieldName]);
    }
  };

  onChange = (selected: string[]) => {
    this.setState({ selected });
    this.props.onChange({
      ...this.props.options,
      include: selected.join('|'),
    });
  };

  render() {
    const { options, selected } = this.state;
    return (
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
          <div className="gf-form-label width-8">序列ID</div>
          <HorizontalGroup spacing="xs" align="flex-start" wrap>
            {options.map((o, i) => {
              const label = `${o.refId}${o.count > 1 ? ' (' + o.count + ')' : ''}`;
              const isSelected = selected.indexOf(o.refId) > -1;
              return (
                <FilterPill
                  key={`${o.refId}/${i}`}
                  onClick={() => {
                    this.onFieldToggle(o.refId);
                  }}
                  label={label}
                  selected={isSelected}
                />
              );
            })}
          </HorizontalGroup>
        </div>
      </div>
    );
  }
}

export const filterFramesByRefIdTransformRegistryItem: TransformerRegistyItem<FilterFramesByRefIdTransformerOptions> = {
  id: DataTransformerID.filterByRefId,
  editor: FilterByRefIdTransformerEditor,
  transformation: standardTransformers.filterFramesByRefIdTransformer,
  name: '通过查询过滤数据',
  description:
    '通过查询过滤数据。如果您要共享来自具有许多查询的另一个面板的结果，并且只想在该面板中可视化该结果的子集，则这很有用。',
};
