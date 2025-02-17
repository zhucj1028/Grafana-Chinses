import React, { FC, useEffect } from 'react';
import { css } from 'emotion';
import { GrafanaTheme, SelectableValue } from '@grafana/data';
import { Button, FormAPI, HorizontalGroup, stylesFactory, useTheme, Spinner } from '@grafana/ui';
import { NotificationChannelType, NotificationChannelDTO, NotificationChannelSecureFields } from '../../../types';
import { NotificationSettings } from './NotificationSettings';
import { BasicSettings } from './BasicSettings';
import { ChannelSettings } from './ChannelSettings';

interface Props extends Omit<FormAPI<NotificationChannelDTO>, 'formState'> {
  selectableChannels: Array<SelectableValue<string>>;
  selectedChannel?: NotificationChannelType;
  imageRendererAvailable: boolean;
  secureFields: NotificationChannelSecureFields;
  resetSecureField: (key: string) => void;
  onTestChannel: (data: NotificationChannelDTO) => void;
}

export interface NotificationSettingsProps
  extends Omit<FormAPI<NotificationChannelDTO>, 'formState' | 'watch' | 'getValues'> {
  currentFormValues: NotificationChannelDTO;
}

export const NotificationChannelForm: FC<Props> = ({
  control,
  errors,
  selectedChannel,
  selectableChannels,
  register,
  watch,
  getValues,
  imageRendererAvailable,
  onTestChannel,
  resetSecureField,
  secureFields,
}) => {
  const styles = getStyles(useTheme());

  useEffect(() => {
    watch(['type', 'settings.priority', 'sendReminder', 'uploadImage']);
  }, []);

  const currentFormValues = getValues();

  if (!selectedChannel) {
    return <Spinner />;
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.formItem}>
        <BasicSettings
          selectedChannel={selectedChannel}
          channels={selectableChannels}
          secureFields={secureFields}
          resetSecureField={resetSecureField}
          currentFormValues={currentFormValues}
          register={register}
          errors={errors}
          control={control}
        />
      </div>
      {/* If there are no non-required fields, don't render this section*/}
      {selectedChannel.options.filter(o => !o.required).length > 0 && (
        <div className={styles.formItem}>
          <ChannelSettings
            selectedChannel={selectedChannel}
            secureFields={secureFields}
            resetSecureField={resetSecureField}
            currentFormValues={currentFormValues}
            register={register}
            errors={errors}
            control={control}
          />
        </div>
      )}
      <div className={styles.formItem}>
        <NotificationSettings
          imageRendererAvailable={imageRendererAvailable}
          currentFormValues={currentFormValues}
          register={register}
          errors={errors}
          control={control}
        />
      </div>
      <div className={styles.formButtons}>
        <HorizontalGroup>
          <Button type="submit">保存</Button>
          <Button type="button" variant="secondary" onClick={() => onTestChannel(getValues({ nest: true }))}>
            测试
          </Button>
          <a href="/alerting/notifications">
            <Button type="button" variant="secondary">
              返回
            </Button>
          </a>
        </HorizontalGroup>
      </div>
    </div>
  );
};

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    formContainer: css``,
    formItem: css`
      flex-grow: 1;
      padding-top: ${theme.spacing.md};
    `,
    formButtons: css`
      padding-top: ${theme.spacing.xl};
    `,
  };
});
