// Libraries
import React, { PureComponent } from 'react';
import { hot } from 'react-hot-loader';
import isString from 'lodash/isString';
import { Icon } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';
// Components
import Page from 'app/core/components/Page/Page';
import { GenericDataSourcePlugin, PluginSettings } from './PluginSettings';
import BasicSettings from './BasicSettings';
import ButtonRow from './ButtonRow';
// Services & Utils
import appEvents from 'app/core/app_events';
// Actions & selectors
import { getDataSource, getDataSourceMeta } from '../state/selectors';
import {
  deleteDataSource,
  initDataSourceSettings,
  loadDataSource,
  testDataSource,
  updateDataSource,
} from '../state/actions';
import { getNavModel } from 'app/core/selectors/navModel';
import { getRouteParamsId } from 'app/core/selectors/location';
// Types
import { CoreEvents, StoreState } from 'app/types/';
import { DataSourcePluginMeta, DataSourceSettings, NavModel, UrlQueryMap } from '@grafana/data';
import { getDataSourceLoadingNav } from '../state/navModel';
import PluginStateinfo from 'app/features/plugins/PluginStateInfo';
import { dataSourceLoaded, setDataSourceName, setIsDefault } from '../state/reducers';
import { connectWithCleanUp } from 'app/core/components/connectWithCleanUp';

export interface Props {
  navModel: NavModel;
  dataSource: DataSourceSettings;
  dataSourceMeta: DataSourcePluginMeta;
  pageId: number;
  deleteDataSource: typeof deleteDataSource;
  loadDataSource: typeof loadDataSource;
  setDataSourceName: typeof setDataSourceName;
  updateDataSource: typeof updateDataSource;
  setIsDefault: typeof setIsDefault;
  dataSourceLoaded: typeof dataSourceLoaded;
  initDataSourceSettings: typeof initDataSourceSettings;
  testDataSource: typeof testDataSource;
  plugin?: GenericDataSourcePlugin;
  query: UrlQueryMap;
  page?: string;
  testingStatus?: {
    message?: string;
    status?: string;
  };
  loadError?: Error | string;
}

export class DataSourceSettingsPage extends PureComponent<Props> {
  componentDidMount() {
    const { initDataSourceSettings, pageId } = this.props;
    initDataSourceSettings(pageId);
  }

  onSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    await this.props.updateDataSource({ ...this.props.dataSource });

    this.testDataSource();
  };

  onTest = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    this.testDataSource();
  };

  onDelete = () => {
    appEvents.emit(CoreEvents.showConfirmModal, {
      title: '删除',
      text: '您确定要删除此数据源吗?',
      yesText: '删除',
      icon: 'trash-alt',
      onConfirm: () => {
        this.confirmDelete();
      },
    });
  };

  confirmDelete = () => {
    this.props.deleteDataSource();
  };

  onModelChange = (dataSource: DataSourceSettings) => {
    this.props.dataSourceLoaded(dataSource);
  };

  isReadOnly() {
    return this.props.dataSource.readOnly === true;
  }

  renderIsReadOnlyMessage() {
    return (
      <div className="grafana-info-box span8">
        此数据源是由config添加的，无法使用UI进行修改。 请与您的服务器管理员联系以更新此数据源。
      </div>
    );
  }

  testDataSource() {
    const { dataSource, testDataSource } = this.props;
    testDataSource(dataSource.name);
  }

  get hasDataSource() {
    return this.props.dataSource.id > 0;
  }

  renderLoadError(loadError: any) {
    let showDelete = false;
    let msg = loadError.toString();
    if (loadError.data) {
      if (loadError.data.message) {
        msg = loadError.data.message;
      }
    } else if (isString(loadError)) {
      showDelete = true;
    }

    const node = {
      text: msg,
      subTitle: '数据源错误',
      icon: 'exclamation-triangle',
    };
    const nav = {
      node: node,
      main: node,
    };

    return (
      <Page navModel={nav}>
        <Page.Contents>
          <div>
            <div className="gf-form-button-row">
              {showDelete && (
                <button type="submit" className="btn btn-danger" onClick={this.onDelete}>
                  删除
                </button>
              )}
              <a className="btn btn-inverse" href="datasources">
                返回
              </a>
            </div>
          </div>
        </Page.Contents>
      </Page>
    );
  }

  renderConfigPageBody(page: string) {
    const { plugin } = this.props;
    if (!plugin || !plugin.configPages) {
      return null; // still loading
    }

    for (const p of plugin.configPages) {
      if (p.id === page) {
        return <p.body plugin={plugin} query={this.props.query} />;
      }
    }

    return <div>网页未找到： {page}</div>;
  }

  renderSettings() {
    const { dataSourceMeta, setDataSourceName, setIsDefault, dataSource, testingStatus, plugin } = this.props;

    return (
      <form onSubmit={this.onSubmit}>
        {this.isReadOnly() && this.renderIsReadOnlyMessage()}
        {dataSourceMeta.state && (
          <div className="gf-form">
            <label className="gf-form-label width-10">插件状态</label>
            <label className="gf-form-label gf-form-label--transparent">
              <PluginStateinfo state={dataSourceMeta.state} />
            </label>
          </div>
        )}

        <BasicSettings
          dataSourceName={dataSource.name}
          isDefault={dataSource.isDefault}
          onDefaultChange={state => setIsDefault(state)}
          onNameChange={name => setDataSourceName(name)}
        />

        {plugin && (
          <PluginSettings
            plugin={plugin}
            dataSource={dataSource}
            dataSourceMeta={dataSourceMeta}
            onModelChange={this.onModelChange}
          />
        )}

        <div className="gf-form-group">
          {testingStatus && testingStatus.message && (
            <div className={`alert-${testingStatus.status} alert`} aria-label={selectors.pages.DataSource.alert}>
              <div className="alert-icon">
                {testingStatus.status === 'error' ? <Icon name="exclamation-triangle" /> : <Icon name="check" />}
              </div>
              <div className="alert-body">
                <div className="alert-title" aria-label={selectors.pages.DataSource.alertMessage}>
                  {testingStatus.message}
                </div>
              </div>
            </div>
          )}
        </div>

        <ButtonRow
          onSubmit={event => this.onSubmit(event)}
          isReadOnly={this.isReadOnly()}
          onDelete={this.onDelete}
          onTest={event => this.onTest(event)}
        />
      </form>
    );
  }

  render() {
    const { navModel, page, loadError } = this.props;

    if (loadError) {
      return this.renderLoadError(loadError);
    }

    return (
      <Page navModel={navModel}>
        <Page.Contents isLoading={!this.hasDataSource}>
          {this.hasDataSource ? <div>{page ? this.renderConfigPageBody(page) : this.renderSettings()}</div> : null}
        </Page.Contents>
      </Page>
    );
  }
}

function mapStateToProps(state: StoreState) {
  const pageId = getRouteParamsId(state.location);
  const dataSource = getDataSource(state.dataSources, pageId);
  const page = state.location.query.page as string;
  const { plugin, loadError, testingStatus } = state.dataSourceSettings;

  return {
    navModel: getNavModel(
      state.navIndex,
      page ? `datasource-page-${page}` : `datasource-settings-${pageId}`,
      getDataSourceLoadingNav('settings')
    ),
    dataSource: getDataSource(state.dataSources, pageId),
    dataSourceMeta: getDataSourceMeta(state.dataSources, dataSource.type),
    pageId: pageId,
    query: state.location.query,
    page,
    plugin,
    loadError,
    testingStatus,
  };
}

const mapDispatchToProps = {
  deleteDataSource,
  loadDataSource,
  setDataSourceName,
  updateDataSource,
  setIsDefault,
  dataSourceLoaded,
  initDataSourceSettings,
  testDataSource,
};

export default hot(module)(
  connectWithCleanUp(mapStateToProps, mapDispatchToProps, state => state.dataSourceSettings)(DataSourceSettingsPage)
);
