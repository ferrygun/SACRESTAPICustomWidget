(function() {
    let _shadowRoot;
    let _id;
    let _score;

    let div;
    let Ar = [];
    let widgetName;

    let tmpl = document.createElement("template");
    tmpl.innerHTML = `
      <style>
      </style>
    `;

    class restAPI extends HTMLElement {

        constructor() {
            super();

            _shadowRoot = this.attachShadow({
                mode: "open"
            });
            _shadowRoot.appendChild(tmpl.content.cloneNode(true));

            _id = createGuid();

            //_shadowRoot.querySelector("#oView").id = _id + "_oView";

            this._export_settings = {};
            this._export_settings.restapiurl = "";
            this._export_settings.score = "";
            this._export_settings.name = "";

            this.addEventListener("click", event => {
                console.log('click');
            });

            this._firstConnection = 0;
            this._firstConnectionUI5 = 0;

        }

        connectedCallback() {
            try {
                if (window.commonApp) {
                    let outlineContainer = commonApp.getShell().findElements(true, ele => ele.hasStyleClass && ele.hasStyleClass("sapAppBuildingOutline"))[0]; // sId: "__container0"

                    if (outlineContainer && outlineContainer.getReactProps) {
                        let parseReactState = state => {
                            let components = {};

                            let globalState = state.globalState;
                            let instances = globalState.instances;
                            let app = instances.app["[{\"app\":\"MAIN_APPLICATION\"}]"];
                            let names = app.names;

                            for (let key in names) {
                                let name = names[key];

                                let obj = JSON.parse(key).pop();
                                let type = Object.keys(obj)[0];
                                let id = obj[type];

                                components[id] = {
                                    type: type,
                                    name: name
                                };
                            }

                            for (let componentId in components) {
                                let component = components[componentId];
                            }

                            let metadata = JSON.stringify({
                                components: components,
                                vars: app.globalVars
                            });

                            if (metadata != this.metadata) {
                                this.metadata = metadata;

                                this.dispatchEvent(new CustomEvent("propertiesChanged", {
                                    detail: {
                                        properties: {
                                            metadata: metadata
                                        }
                                    }
                                }));
                            }
                        };

                        let subscribeReactStore = store => {
                            this._subscription = store.subscribe({
                                effect: state => {
                                    parseReactState(state);
                                    return {
                                        result: 1
                                    };
                                }
                            });
                        };

                        let props = outlineContainer.getReactProps();
                        if (props) {
                            subscribeReactStore(props.store);
                        } else {
                            let oldRenderReactComponent = outlineContainer.renderReactComponent;
                            outlineContainer.renderReactComponent = e => {
                                let props = outlineContainer.getReactProps();
                                subscribeReactStore(props.store);

                                oldRenderReactComponent.call(outlineContainer, e);
                            }
                        }
                    }
                }
            } catch (e) {}
        }

        disconnectedCallback() {
            if (this._subscription) { // react store subscription
                this._subscription();
                this._subscription = null;
            }
        }

        onCustomWidgetBeforeUpdate(changedProperties) {
            if ("designMode" in changedProperties) {
                this._designMode = changedProperties["designMode"];
            }
        }

        onCustomWidgetAfterUpdate(changedProperties) {
            UI5(changedProperties, this);
        }

        _renderExportButton() {
            let components = this.metadata ? JSON.parse(this.metadata)["components"] : {};
            console.log("_renderExportButton-components");
            console.log(components);
        }

        _firePropertiesChanged() {
            this.score = "";
            this.dispatchEvent(new CustomEvent("propertiesChanged", {
                detail: {
                    properties: {
                        score: this.score
                    }
                }
            }));
        }

        // SETTINGS
        get restapiurl() {
            return this._export_settings.restapiurl;
        }
        set restapiurl(value) {
            this._export_settings.restapiurl = value;
        }

        get name() {
            return this._export_settings.name;
        }
        set name(value) {
            this._export_settings.name = value;
        }

        get score() {
            return this._export_settings.score;
        }
        set score(value) {
            value = _score;
            this._export_settings.score = value;
        }

        static get observedAttributes() {
            return [
                "restapiurl",
                "name",
                "score"
            ];
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue != newValue) {
                this[name] = newValue;
            }
        }

    }
    customElements.define("com-fd-djaja-sap-sac-restapi", restAPI);

    function UI5(changedProperties, that) {
        var that_ = that;

        div = document.createElement('div');
        widgetName = that._export_settings.name;
        div.slot = "content_" + widgetName;

        var restAPIURL = that._export_settings.restapiurl;
        console.log("restAPIURL: " + restAPIURL);

        if (that._firstConnectionUI5 === 0) {
            console.log("--First Time --");

            let div0 = document.createElement('div');
            div0.innerHTML = '<?xml version="1.0"?><script id="oView_' + widgetName + '" name="oView_' + widgetName + '" type="sapui5/xmlview"><mvc:View xmlns="sap.m" xmlns:mvc="sap.ui.core.mvc" xmlns:core="sap.ui.core" xmlns:l="sap.ui.layout" height="100%" controllerName="myView.Template"><l:VerticalLayout class="sapUiContentPadding" width="100%"><l:content><Input id="input"  placeholder="Enter partner number..." liveChange=""/></l:content><Button id="buttonId" class="sapUiSmallMarginBottom" text="Get Score" width="150px" press=".onButtonPress" /></l:VerticalLayout></mvc:View></script>';
            _shadowRoot.appendChild(div0);

            let div1 = document.createElement('div');
            div1.innerHTML = '<div id="ui5_content_' + widgetName + '" name="ui5_content_' + widgetName + '"><slot name="content_' + widgetName + '"></slot></div>';
            _shadowRoot.appendChild(div1);

            that_.appendChild(div);

            var mapcanvas_divstr = _shadowRoot.getElementById('oView_' + widgetName);

            Ar.push({
                'id': widgetName,
                'div': mapcanvas_divstr
            });
            console.log(Ar);
        }

        sap.ui.getCore().attachInit(function() {
            "use strict";

            //### Controller ###
            sap.ui.define([
                "jquery.sap.global",
                "sap/ui/core/mvc/Controller",
                "sap/m/MessageToast",
                'sap/m/MessageBox'
            ], function(jQuery, Controller, MessageToast, MessageBox) {
                "use strict";

                return Controller.extend("myView.Template", {

                    onButtonPress: function(oEvent) {

                        var partnernumber = oView.byId("input").getValue(); //"0004540866"
                        console.log(partnernumber);

                        $.ajax({
                            url: restAPIURL,
                            type: 'POST',
                            data: $.param({
                                "partnernumber": partnernumber
                            }),
                            contentType: 'application/x-www-form-urlencoded',
                            success: function(data) {
                                console.log(data);
                                _score = data;

                                that._firePropertiesChanged();
                                this.settings = {};
                                this.settings.score = "";

                                that.dispatchEvent(new CustomEvent("onStart", {
                                    detail: {
                                        settings: this.settings
                                    }
                                }));

                            },
                            error: function(e) {
                                console.log("error: " + e);
                            }
                        });
                    }
                });
            });

            console.log("widgetName:" + widgetName);
            var foundIndex = Ar.findIndex(x => x.id == widgetName);
            var divfinal = Ar[foundIndex].div;

            //### THE APP: place the XMLView somewhere into DOM ###
            var oView = sap.ui.xmlview({
                viewContent: jQuery(divfinal).html(),
            });

            oView.placeAt(div);

            if (that_._designMode) {
                oView.byId("buttonId").setEnabled(false);
                oView.byId("input").setEnabled(false);
            } else {
                oView.byId("buttonId").setEnabled(true);
                oView.byId("input").setEnabled(true);
            }
        });
    }

    function createGuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
            let r = Math.random() * 16 | 0,
                v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

})();