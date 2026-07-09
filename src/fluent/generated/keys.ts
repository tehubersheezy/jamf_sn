import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'app-menu': {
                        table: 'sys_app_application'
                        id: '2299420c5b9b48b8a51272fdaf4c4e80'
                    }
                    'app-menu-devices': {
                        table: 'sys_app_module'
                        id: '2dc6ca3f4fce432bac7c7797e800df90'
                    }
                    'app-menu-import-runs': {
                        table: 'sys_app_module'
                        id: 'abea2d9784ff4eae9a359a4cfe0acb54'
                    }
                    'app-menu-mdm-commands': {
                        table: 'sys_app_module'
                        id: '0bba443e0bf14a4e8419ae7aa0ee0ceb'
                    }
                    'app-menu-properties': {
                        table: 'sys_app_module'
                        id: '04002513b2b142fd9dfddc43d9e3dc08'
                    }
                    'app-menu-scheduled-sync': {
                        table: 'sys_app_module'
                        id: '1366a34e14514a2bb61e861c77c1bd77'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: '20246ed3ebdc4bf2ab65b4705bb4065b'
                    }
                    'command-log-create-acl': {
                        table: 'sys_security_acl'
                        id: '0759192ceac74057a45d2f0c317ad0d6'
                    }
                    'command-log-delete-acl': {
                        table: 'sys_security_acl'
                        id: '39814c34eaee447ea3a2e0232599c32e'
                    }
                    'command-log-payload-field-acl': {
                        table: 'sys_security_acl'
                        id: 'f535ef59c42d43d383374d6c6e5e7737'
                    }
                    'command-log-pin-field-acl': {
                        table: 'sys_security_acl'
                        id: '94204b1570414936bea22e57b4b96eab'
                    }
                    'command-log-read-acl': {
                        table: 'sys_security_acl'
                        id: '6c71e5c2fe684c3cb8b77fefe1c42e9c'
                    }
                    'command-log-write-acl': {
                        table: 'sys_security_acl'
                        id: '94e08c6fbf684312befb0ee842d13907'
                    }
                    'command-reconciler-job': {
                        table: 'sysauto_script'
                        id: '7b0ec965dea945d4930e1104c1e2fe09'
                    }
                    'daily-sync-job': {
                        table: 'sysauto_script'
                        id: 'a298764dbe894cf5ba9649cc91cdad29'
                    }
                    'device-create-acl': {
                        table: 'sys_security_acl'
                        id: '568253d2b3e44500909e429ca605d18c'
                    }
                    'device-delete-acl': {
                        table: 'sys_security_acl'
                        id: '4c422f2da9044285bb247e30689f4b4d'
                    }
                    'device-read-acl': {
                        table: 'sys_security_acl'
                        id: '706adb61b661417eb1022e23e7c0a7d5'
                    }
                    'device-write-acl': {
                        table: 'sys_security_acl'
                        id: '96a48510c5424600a93c50e6a1db48c5'
                    }
                    'import-run-create-acl': {
                        table: 'sys_security_acl'
                        id: '660a363e160d41a39b6572e8ae514025'
                    }
                    'import-run-delete-acl': {
                        table: 'sys_security_acl'
                        id: '1edc2e3c3a3c48ec942198549aa22363'
                    }
                    'import-run-read-acl': {
                        table: 'sys_security_acl'
                        id: '488bec3f39b8419c90ecb6ff79975a3d'
                    }
                    'import-run-write-acl': {
                        table: 'sys_security_acl'
                        id: '5eb985727a4c4020ad8d89f02ad0ccb6'
                    }
                    JamfApiClient: {
                        table: 'sys_script_include'
                        id: 'ce3cf7c4bd224a90adf80cacd5dd68f7'
                    }
                    JamfCommandClient: {
                        table: 'sys_script_include'
                        id: 'c7a73b1ecc5c4006b7069960a5723c41'
                    }
                    JamfCommandLogger: {
                        table: 'sys_script_include'
                        id: 'bddd1014f6a14a4ab1ff9ec20f0e1511'
                    }
                    JamfCommandReconciler: {
                        table: 'sys_script_include'
                        id: '0664480a7161490bb0c30c08a44b6d2f'
                    }
                    JamfCommandService: {
                        table: 'sys_script_include'
                        id: 'efd31c70dc4147b08744b5e6709f118b'
                    }
                    JamfComputerMapper: {
                        table: 'sys_script_include'
                        id: '9e40f8de3703421f8a327a56b6287f6d'
                    }
                    JamfConfig: {
                        table: 'sys_script_include'
                        id: '36cf9715b10c4102bf3298e78d17999a'
                    }
                    JamfDeviceRegistry: {
                        table: 'sys_script_include'
                        id: 'f2f0b3f070a046c98033582c1c6423cc'
                    }
                    JamfIreGateway: {
                        table: 'sys_script_include'
                        id: '7971715416a0491d88439dc8c761e62c'
                    }
                    JamfMapperBase: {
                        table: 'sys_script_include'
                        id: '979669a957104d96a7cc5c70d1a86d47'
                    }
                    JamfMobileDeviceMapper: {
                        table: 'sys_script_include'
                        id: '5da4228d4ce94c3485a4b211ab137101'
                    }
                    JamfRunLogger: {
                        table: 'sys_script_include'
                        id: 'c24b7acf92da4d39b82708d48d965e4b'
                    }
                    JamfSyncRunner: {
                        table: 'sys_script_include'
                        id: '8e58f3be1c3146fe9e9c626ebf28321b'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'c645d2ad77dc413695d82701630b71c7'
                    }
                    'prop-actions-destructive-enabled': {
                        table: 'sys_properties'
                        id: '4016e61bfec8440c91bcc1ad3ae59e87'
                    }
                    'prop-actions-dry-run': {
                        table: 'sys_properties'
                        id: 'bc8a4b9c0a374d4d992fc074067dc0b0'
                    }
                    'prop-actions-enabled': {
                        table: 'sys_properties'
                        id: '62bfbdb6148e42d2b3e2a880052845d2'
                    }
                    'prop-base-url': {
                        table: 'sys_properties'
                        id: '746a175312124ca4b6e1e489bc4bb5bd'
                    }
                    'prop-client-id': {
                        table: 'sys_properties'
                        id: '25d7ee330e87491fb7bb58c451525a84'
                    }
                    'prop-client-secret': {
                        table: 'sys_properties'
                        id: 'c7dd683a0f8b43e28d5efb1b7ce5d772'
                    }
                    'prop-command-batch-size': {
                        table: 'sys_properties'
                        id: '0ca28b89696e4dd08ab86743f7fb00a1'
                    }
                    'prop-command-expiry-hours': {
                        table: 'sys_properties'
                        id: 'dbe096b242da48ceaa4922dbd4355f28'
                    }
                    'prop-command-group-erase-max': {
                        table: 'sys_properties'
                        id: '7d0195bcdd8f4c4e90f0e77fde3887df'
                    }
                    'prop-command-reconcile-interval-min': {
                        table: 'sys_properties'
                        id: '6c3c5e0c9b4b4110a5f4ea52d3962def'
                    }
                    'prop-discovery-source': {
                        table: 'sys_properties'
                        id: '1ff1b6ecf894459189bedfdce682bf6c'
                    }
                    'prop-ire-batch-size': {
                        table: 'sys_properties'
                        id: '50901fd98e1b44ec97bf81ac98cad455'
                    }
                    'prop-log-verbose': {
                        table: 'sys_properties'
                        id: '8fe5fbbfb18c4d188efd3dc60354aa06'
                    }
                    'prop-map-assigned-to': {
                        table: 'sys_properties'
                        id: 'ead739c34a9945eea1461c5d24304954'
                    }
                    'prop-mobile-detail-mode': {
                        table: 'sys_properties'
                        id: '6e1bfa5dd8a5406688ee214f9b5253aa'
                    }
                    'prop-page-size': {
                        table: 'sys_properties'
                        id: '3abb0a234ca9497e824d14daa3766634'
                    }
                    'prop-run-log-retention-days': {
                        table: 'sys_properties'
                        id: '9f05595f56e541f4802ab24682ae525e'
                    }
                    'prop-sync-computers-enabled': {
                        table: 'sys_properties'
                        id: 'd1c4247ec8fd40439830604c6f220d55'
                    }
                    'prop-sync-enabled': {
                        table: 'sys_properties'
                        id: '5bc2555d0e564b01925c050be5a5cb99'
                    }
                    'prop-sync-mobile-enabled': {
                        table: 'sys_properties'
                        id: 'b9943a6fb5004c4599a92b10e1252d79'
                    }
                    'xsp-ire-execute': {
                        table: 'sys_scope_privilege'
                        id: '105f4dc12a3743d1acee9698bde7a5ca'
                    }
                }
                composite: [
                    {
                        table: 'sys_documentation'
                        id: '00bd7e2659a747cdb7ee6f7df55f29d1'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'device_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '02e5091baca74ebabd37fe4cb236999a'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'ended'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '03590f379547435db843a65ea300c442'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'started'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '039321858eb747d99d528a3f17b3a8a6'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'target_management_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '050438974e6a4833b60c1817c9058150'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'status'
                            value: 'skipped'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '065ea9039d01454d9f732fa3bc7a81bf'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'status'
                            value: 'failed'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '07c39bc1648d4835b42c9bffc5ff37e8'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'RESTART_DEVICE'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '07cd6ad399044505ba9bbfa5a0ac220e'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'device_type'
                            value: 'mobile'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0a854098e54545cb9c956e48cc3d56dc'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'RENEW_PROFILE'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0c8ddb2468024fde8e2fb1c26a2b4560'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'requested_by'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '0ca01eced03e4e3fb7c8b52ee7e32e0b'
                        key: {
                            sys_security_acl: '1edc2e3c3a3c48ec942198549aa22363'
                            sys_user_role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0e7d85836b104b3e822878f09ef9ecd0'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'MOBILE_ERASE'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '11334f4f93f44acaa4540ebd66529a08'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'date_sent'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '15b46dc1cf084e609ac731c79bfff5ca'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '16ddfabc9f7a42379ffbfeb672b475d7'
                        key: {
                            name: 'x_912401_jamf_pro.approver'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '18c1ae9e80a643a0871897ac1f9ef2b2'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1a3a08a4e83c478286124503061d3045'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'status'
                            value: 'completed'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1a5f467826564d17b8f34f84f4218bc2'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'not_now'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1bc3b827299c4a53b64f126418bf1ad7'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'target_ci'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1d56c134930f4b4ea4887c90b4963bbe'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '21e99c445f6b4315bfbcddc14fd42db6'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'REDEPLOY_FRAMEWORK'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '227ef02266df4cbcba76916e1f11a4ad'
                        key: {
                            sys_security_acl: '4c422f2da9044285bb247e30689f4b4d'
                            sys_user_role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2386511c7b434bd88648f48b9c2673ff'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'approval'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '251075cfc7b644b889a270077f957745'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'approval_state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '26d320a8291f44a3adf0c2e22382b871'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'BLANK_PUSH'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '296597ccf335451783224411c6c72a5e'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2a1be8d8e7e94cb0b1b542af972fe2f5'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2b197b45e6dc4a628ec2b5321b85d844'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'computers_fetched'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2b5ff1b13b524b70b78f164235d6c8ba'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'managed'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2d13cf89be534482b940dffb20ea11d2'
                        key: {
                            sys_security_acl: '94e08c6fbf684312befb0ee842d13907'
                            sys_user_role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2fb355fd35a04627919f0db33726784e'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'date_expires'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2fe84ec572f6499dae7efd44aa3c18bf'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'CLEAR_PASSCODE'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '307032c178014b01b81b38eb730fb02b'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'target_jamf_id'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '30d03140050143bbb473dbaaad39dfad'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3182bb788c354e7d9002c90367ad283c'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'ERASE_DEVICE'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3188df5bd1d9446381b1b3dd85c99d9f'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'no_change'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3496b45001234f3e996313c08d9b0ff2'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'dry_run'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3579a46b8d1c4ace85b774acb20f8eb2'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'management_id'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '37fd3646001a4e3dbbe04e5979bcb442'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'source'
                            value: 'ui_action'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '381f92d86370458c8d22b4699ea17676'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'managed'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3956dd2d2b0440309f8a8a9f3643f829'
                        key: {
                            sys_security_acl: '6c71e5c2fe684c3cb8b77fefe1c42e9c'
                            sys_user_role: {
                                id: 'a7940bf603654305b5381ec513b39c8d'
                                key: {
                                    name: 'x_912401_jamf_pro.operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '39840e62f8d849f1829d1796558c55e7'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'reconcile_mode'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3a3b7efa5ae043e8bfa03d2a609570a4'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'udid'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3ce035c540214c0bbbe08241c6251d7a'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3f64bf1832a64ff3a354b761e75528c9'
                        key: {
                            sys_security_acl: '5eb985727a4c4020ad8d89f02ad0ccb6'
                            sys_user_role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '411001ed83fe49a0a2127107b610efab'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'poll_attempts'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4217c879a9ab4832962572d8e3c1ffa4'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'error_detail'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role_contains'
                        id: '449c4e3169b84a95b8659acccd79f1b6'
                        key: {
                            role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                            contains: {
                                id: 'a7940bf603654305b5381ec513b39c8d'
                                key: {
                                    name: 'x_912401_jamf_pro.operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '48ed04e4e9fd4f2d9d21d878c8f1653e'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'dedupe_key'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '49c3d92d1b474073a4436fa35581dfcb'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'device_type'
                            value: 'computer'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '49dfb3f2d7934d0fbbf90e0896a7b8ee'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'last_polled'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4c3fec4f78074eed84e36a56caf1a77c'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'reconcile_mode'
                            value: 'uuid'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4c999076fe1948ec809a5303725ab24a'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'dedupe_key'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '50382621c936402186b6a5019e57aa6c'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'serial_number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '53c941d61b524cfb9cb1a79fa4e07c95'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'run_type'
                            value: 'scheduled'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '54571104ac094c6e94278e394bca493a'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '548a741a9f30476c9f415d92bb41c517'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'http_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '577f42f1f7e84eea8b50a96757b119be'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'message'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '58774d764cd14b65819ebeac5b8741b5'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '58e53547e0f04e37af617552a0070c5d'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '590ba6108bde48d298b0a425f51e40f6'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'device'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '597f5970c78b4927accfe6b246c9dd03'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'run_type'
                            value: 'test'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5a3929a018324e5aa3a115440886e751'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'no_change'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5af050538e56498a9b329f571dbd1ef2'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'batch'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5b4e663533db4fac9efdee97d83dcc72'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'status'
                            value: 'completed_with_errors'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5ce64dde08084b68b9ea925955e89621'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'unlock_pin'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5ef534d319154ec0965483d7f3743b8d'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'run_type'
                            value: 'manual'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6234372a1e5143ef9d4d4c9c9f8e90f1'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'updates'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '632b59308aa745e49ebbf4c23949660b'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'ended'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '633d7b534253435583d79cdc3ada0f9f'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'DEPLOY_PACKAGE'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '638fc6c97aee4b1ba77566ed5acc1561'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'target_udid'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '642ad1343aa44c48aed0578e3019b13e'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'COMPUTER_REMOVE_MDM'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '648863796e184b0faa2f0656b771c8ef'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'DISABLE_LOST_MODE'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '64e57723e2ac4940aaf3354cb422e43a'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'target_ci'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '66313813fe5047389a539debfcd8290f'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'source'
                            value: 'catalog'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6661b2d489a244bc8c546d993ac1534d'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'jamf_command_uuid'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '677e736226f84e00bbd21747b04fd53e'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'serial_number'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6789c9df03894e36828937d7ccfa4f88'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'source'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '68d8dcbe58514710aa2f4594c9a337c6'
                        key: {
                            sys_security_acl: '568253d2b3e44500909e429ca605d18c'
                            sys_user_role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '69e60ac3b8b9420988295ee1aa2f2282'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'management_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6b4f7b6b259e4e378604b57dd3097bcb'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6b57f1a710a84b5d9881aa16c1a32a80'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'target_udid'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '6bc868fb14994b5d925452e6fc045ee8'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'run_type'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6c78dc5bddbb429ab2b87c70cde8c966'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'rejected'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6c8b9f19d2ed4deb92b4e9e5eee752ca'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'jamf_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6e30849cd8a84bb99f8a5e5bd24c15e6'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'message'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6f44ac86f7f94a1bb4cb6dd80a14a6b8'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'status'
                            value: 'running'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6fe91a5662df41dfbc9eeccb6adbe2f4'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'requested_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '702ac1f9f268485187c87d28a93b9b31'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'inserts'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '70c1248cdee84ba6968a49dfe73ffb97'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'pending_send'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7163a570d27047c5855baf4b2ba0acf6'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'error'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7321958a43264da0ada406dd86cdd8d8'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'ENABLE_LOST_MODE'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '74ac396e81c24bb1a87d056393ac380e'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'error_detail'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '75bcbc32b32f437086d62ca8c29734ad'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'UPDATE_PLAN_GROUP'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7705f506dc9c49378ddf4264ad560cdf'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'approval_state'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '78ba07448cb64660ad9ee50421e2db3e'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '7b6e02132c804f49ae60cb53a3d93757'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7bc1e79db8824050995d5324e228f32a'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'date_requested'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7c53b20208e747dda67c93bd38f6d1d5'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'error_reason'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '7d60d87c0d6a4f59a7d548c497cd96e6'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '7fb807242a8941e798f8ea6a9fefc3fd'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'device_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8607e79276044c23a3b395152cb938ed'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'poll_attempts'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '860bd9ba1ca44a53aa43fa043b8d41ac'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'requested'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '89bef2bb26aa43ea8279a18006a83914'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'expired'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8a6c9fc2d2174987a7ab749f8fe4bfe2'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'canceled'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8bcebc5dfde44925a4478d2df2ac2690'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'error_reason'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8d66ff82d8b347338b9ba57b81060e63'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'started'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8de0169fd9144f61b53b37f957a4dbbf'
                        key: {
                            sys_security_acl: '39814c34eaee447ea3a2e0232599c32e'
                            sys_user_role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8e8dac68742b4bccba1ef93c17da35cb'
                        key: {
                            name: 'cmdb_ci'
                            element: 'discovery_source'
                            value: 'JamfPro'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8eacb3345366420881ba182aa2c4a8ed'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'inserts'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9149f55e66484ce88195c1d1f5cb0199'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'last_seen'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '91df1c747fec46eaa12afb790a41a617'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'date_acknowledged'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9ed25456c5614debb2cf462ff4714202'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'device_type'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'a240d598a5f44a78bd580b1ee1b07672'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a34d13b11b2d44ca955cf157bf3b4bf4'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'acknowledged'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a3865824d994477e9957b175ebe9d27c'
                        key: {
                            sys_security_acl: '706adb61b661417eb1022e23e7c0a7d5'
                            sys_user_role: {
                                id: 'a7940bf603654305b5381ec513b39c8d'
                                key: {
                                    name: 'x_912401_jamf_pro.operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a388f0a6a660498398783983ccc5abdf'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'a3a4cb1d022341be9b7593233cb03070'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a5b00fedf5234dd78e965bcf70f76aa9'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'jamf_command_uuid'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a5dc64cfcc08442ca4656635f7deadeb'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'device_type'
                            value: 'mobile'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'a6f62ffabf2145f481adf5ec991dae84'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'device_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a72009ecbcbd4da7a6e62925a18794c5'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a73205d86c024140a4f54c6954ad3d2d'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'ci'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: 'a7940bf603654305b5381ec513b39c8d'
                        key: {
                            name: 'x_912401_jamf_pro.operator'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a83f404b8957452caf4d1c324d9aa1e7'
                        key: {
                            sys_security_acl: '0759192ceac74057a45d2f0c317ad0d6'
                            sys_user_role: {
                                id: 'a7940bf603654305b5381ec513b39c8d'
                                key: {
                                    name: 'x_912401_jamf_pro.operator'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a887061de96f4d3eb8d4a1029cf513df'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'device_type'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a8c62c030b4e4ea9b68d25eb44ec4543'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action_payload'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a963cd2f04b74cd69262d28048c0b5fe'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'MACOS_UPDATE'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ad64f71785f74091b0d0f8b45ba93f88'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'approved_by'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'b1b19b8ea1a641859bf72aaed6afa72e'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b26031e4db1f4401839bd86803a17d38'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'date_expires'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b29dc25d9b964c31b267179f23658a73'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'approved'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b56a76dbc9744d52989f1ba9f9b68e1f'
                        key: {
                            sys_security_acl: 'f535ef59c42d43d383374d6c6e5e7737'
                            sys_user_role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b6c041bd891a4a97af3e865768e047ca'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'source'
                            value: 'flow'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b859663f19784d0fac5fa77bff415fe3'
                        key: {
                            sys_security_acl: '96a48510c5424600a93c50e6a1db48c5'
                            sys_user_role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b9091877738544ecbdff6665aabecee5'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'run_type'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bc72c3c286994195bad625cbe907bb82'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'udid'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c0044a602e6b4add90148a38bfbe649d'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'date_requested'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c020e5371657456b94ddaf9008bf457b'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'reconcile_mode'
                            value: 'effect'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c195e3aec7444461a4d2bd0b3a82f5d6'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'target_jamf_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c3ea131d7b8948eb8e1044ca176b3af0'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'DEVICE_LOCK'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c560bb0cb6034651a7b9ad8794eb8fcc'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'device_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c653d975473345878f16b1a555aa18ba'
                        key: {
                            sys_security_acl: '488bec3f39b8419c90ecb6ff79975a3d'
                            sys_user_role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c71d4cdcfa2c4c3abf55b93a6cfb93f2'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'mobile_fetched'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c7b09c3319464eb092d8e38ea5465155'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'is_destructive'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cc0f95e8e7cf4628b49a2838102b16d6'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'updates'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cd59604885b04a22b9d40048cec3f90f'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'ci'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ceabccd9f74644ad9301057bb4299dc7'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'computers_fetched'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cf3b0442c2794d0cbc017d4f669dcce4'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'cf49439f737f4a2fa09a76fff62cc4b5'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cf8235b3d0cb4fa28e11770895b77829'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'device_type'
                            value: 'computer'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cfdcced5630a4c3aba87e849d80fbaf6'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'UPDATE_PLAN_DEVICES'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd046540319b544f1a35a46ef92fb9363'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'MOBILE_UNMANAGE'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd0676f99540b416cb04f9f3bb057d890'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'date_sent'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd1c3ba05263b4b798d1914fe5e705c6d'
                        key: {
                            sys_security_acl: '660a363e160d41a39b6572e8ae514025'
                            sys_user_role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd581d59b11a44396b968bd37ade93ae6'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd6545e46a6ea456caacb4d3c916fdd3d'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'device'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd70161d326864028a754d1c19649937e'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'errors'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd91e42555a0f430ebd2a9d419320cae7'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'SHUT_DOWN_DEVICE'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dcfc7dbbbbdd494b9fa80fa78342ba72'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'last_polled'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ddd3aa34f25845a7bef36bcd15e97551'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'run_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'de525ec68c1e402496a504b74f94f323'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'approved_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'dfa73197898642bf994aa71c3d18af1d'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'http_status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e143e8ab174540608ab18014fe2d861f'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'approval'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e2f4d2805ed147b9a6663c3f5f3b2172'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'pending_approval'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'e674848d3dd745c8adc8d0028543d37a'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e72062cce78542b48fce8391b39affa6'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'reconcile_mode'
                            value: 'none'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e9895b44d34d42d7ab723ab3c6a6d08d'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'reconcile_mode'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e9e49d207e6d46499b0fa8e121330179'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'errors'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ead1aa6a7f8b4fb88aa9db8a950ebb0f'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action_payload'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'eb69bcb8f6224e028735368d22f1a073'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'jamf_id'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ec1bf414dc804f69b895edc97beca4fb'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'date_acknowledged'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ece67e33409547368ae4b6afc315bcb7'
                        key: {
                            sys_security_acl: '94204b1570414936bea22e57b4b96eab'
                            sys_user_role: {
                                id: 'f7944615bcc74fbbafd36d6dfa373527'
                                key: {
                                    name: 'x_912401_jamf_pro.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ee4f6a1ffac347a2871c9268d02e3484'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'is_destructive'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ee50d48618e04f868916527148dd3f38'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'source'
                            value: 'security_incident'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ef5c2d9db8a84c7684098f26cc84452a'
                        key: {
                            name: 'x_912401_jamf_pro_device'
                            element: 'last_seen'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f0044de92e314344b65abca59900a44b'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'unlock_pin'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f0645ded58eb40189348d14c2c8c4773'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'PLAY_LOST_MODE_SOUND'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f0822ff745f34a82900124b2ff18ebe5'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'COMPUTER_ERASE'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f4a5dcdcc20e4fb2b77df855fe67492c'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'action'
                            value: 'GROUP_ERASE'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f57ae1aaae9547e2a15804c5609cf7b1'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'source'
                            value: 'api'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f5f8bfac55aa40aca8666693e316e720'
                        key: {
                            name: 'x_912401_jamf_pro_import_run'
                            element: 'mobile_fetched'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: 'f7944615bcc74fbbafd36d6dfa373527'
                        key: {
                            name: 'x_912401_jamf_pro.admin'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f806918f061c481aa695d01ec18fac09'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'batch'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f8f405c29d7e4e609a34a74ce280f52c'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'target_management_id'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f9139dbbafeb4d169bb1744b0e836251'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'reconcile_mode'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f91e2a9918d445b283b6b707d80a535c'
                        key: {
                            name: 'x_912401_jamf_pro_command_log'
                            element: 'status'
                            value: 'sent'
                        }
                    },
                ]
            }
        }
    }
}
