// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent, screen} from '@testing-library/react';
import type {ComponentProps} from 'react';
import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import * as preferencesActions from 'mattermost-redux/actions/preferences';
import {getPreferenceKey} from 'mattermost-redux/utils/preference_utils';

import {renderWithContext} from 'tests/react_testing_utils';
import {getPluginPreferenceKey} from 'utils/plugins/preferences';

import type {GlobalState} from 'types/store';

import PluginSetting from './plugin_setting';

type Props = ComponentProps<typeof PluginSetting>;

const SECTION_TITLE = 'some title';
const PLUGIN_ID = 'pluginId';
const SETTING_1_NAME = 'setting_name';
const SETTING_2_NAME = 'setting_name_2';
const OPTION_0_TEXT = 'Option 0';
const OPTION_1_TEXT = 'Option 1';
const OPTION_2_TEXT = 'Option 2';
const OPTION_3_TEXT = 'Option 3';
const SAVE_TEXT = 'Save';

function getBaseProps(): Props {
    return {
        activeSection: '',
        pluginId: PLUGIN_ID,
        section: {
            settings: [
                {
                    default: '0',
                    name: SETTING_1_NAME,
                    options: [
                        {
                            text: OPTION_0_TEXT,
                            value: '0',
                        },
                        {
                            text: OPTION_1_TEXT,
                            value: '1',
                        },
                    ],
                    type: 'radio',
                },
            ],
            title: SECTION_TITLE,
            onSubmit: jest.fn(),
        },
        updateSection: jest.fn(),
    };
}

describe('plugin setting', () => {
    it('default is properly set', () => {
        const props = getBaseProps();
        props.section.settings[0].default = '1';
        renderWithContext(<PluginSetting {...props}/>);
        expect(screen.queryByText(OPTION_1_TEXT)).toBeInTheDocument();
    });

    it('properly take the current value from the preferences', () => {
        const category = getPluginPreferenceKey(PLUGIN_ID);
        const prefKey = getPreferenceKey(category, SETTING_1_NAME);
        const state: DeepPartial<GlobalState> = {
            entities: {
                preferences: {
                    myPreferences: {
                        [prefKey]: {
                            category,
                            name: SETTING_1_NAME,
                            user_id: 'id',
                            value: '1',
                        },
                    },
                },
            },
        };
        renderWithContext(<PluginSetting {...getBaseProps()}/>, state);
        expect(screen.queryByText(OPTION_1_TEXT)).toBeInTheDocument();
    });

    it('onSubmit gets called', () => {
        const mockSavePreferences = jest.spyOn(preferencesActions, 'savePreferences');
        const props = getBaseProps();
        props.activeSection = SECTION_TITLE;
        props.section.settings.push({
            default: '2',
            name: SETTING_2_NAME,
            options: [
                {
                    value: '2',
                    text: OPTION_2_TEXT,
                },
                {
                    value: '3',
                    text: OPTION_3_TEXT,
                },
            ],
            type: 'radio',
        });
        renderWithContext(<PluginSetting {...props}/>);
        fireEvent.click(screen.getByText(OPTION_1_TEXT));
        fireEvent.click(screen.getByText(OPTION_3_TEXT));
        fireEvent.click(screen.getByText(SAVE_TEXT));
        expect(props.section.onSubmit).toHaveBeenCalledWith({[SETTING_1_NAME]: '1', [SETTING_2_NAME]: '3'});
        expect(props.updateSection).toHaveBeenCalledWith('');
        expect(mockSavePreferences).toHaveBeenCalledWith('', [
            {
                user_id: '',
                category: getPluginPreferenceKey(PLUGIN_ID),
                name: SETTING_1_NAME,
                value: '1',
            },
            {
                user_id: '',
                category: getPluginPreferenceKey(PLUGIN_ID),
                name: SETTING_2_NAME,
                value: '3',
            },
        ]);
    });
    it('does not update anything if nothing has changed', () => {
        const mockSavePreferences = jest.spyOn(preferencesActions, 'savePreferences');
        const props = getBaseProps();
        props.activeSection = SECTION_TITLE;
        renderWithContext(<PluginSetting {...props}/>);
        fireEvent.click(screen.getByText(SAVE_TEXT));
        expect(props.section.onSubmit).not.toHaveBeenCalled();
        expect(props.updateSection).toHaveBeenCalledWith('');
        expect(mockSavePreferences).not.toHaveBeenCalled();
    });

    it('does not consider anything changed after moving back and forth between sections', () => {
        const mockSavePreferences = jest.spyOn(preferencesActions, 'savePreferences');
        const props = getBaseProps();
        props.activeSection = SECTION_TITLE;
        const {rerender} = renderWithContext(<PluginSetting {...props}/>);
        fireEvent.click(screen.getByText(OPTION_1_TEXT));
        props.activeSection = '';
        rerender(<PluginSetting {...props}/>);
        props.activeSection = SECTION_TITLE;
        rerender(<PluginSetting {...props}/>);

        fireEvent.click(screen.getByText(SAVE_TEXT));
        expect(props.section.onSubmit).not.toHaveBeenCalled();
        expect(props.updateSection).toHaveBeenCalledWith('');
        expect(mockSavePreferences).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText(OPTION_1_TEXT));
        props.activeSection = 'other section';
        rerender(<PluginSetting {...props}/>);
        props.activeSection = SECTION_TITLE;
        rerender(<PluginSetting {...props}/>);
        fireEvent.click(screen.getByText(SAVE_TEXT));
        expect(props.section.onSubmit).not.toHaveBeenCalled();
        expect(props.updateSection).toHaveBeenCalledWith('');
        expect(mockSavePreferences).not.toHaveBeenCalled();
    });
});
