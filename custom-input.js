(function(w){
	var ko = w.ko;
	var Class = w.Class;

	if(!ko) throw new Error("Knockout is not defined");
	if(!Class) throw new Error("MooTools is not defined");

	// Create HTML
	function createHTML(options) {
		var element = options.element;
		
		var customElement = new Element('div', { 'class' : 'custom-input-element' });
		var customWrapper = new Element('div', {
			'class' : 'input-wrapper',
			'data-bind' : 'customInputHasFocus: isEdit, css: { editable: isEdit }'
		});
		var autoDropList = new Element('div', {
			'class' : 'auto-droplist',
			'data-bind' : "visible: isAutoComplete() && hasValues() && showAutoComplete()"
		});
		// Wrap
		customElement.grab(customWrapper);
		customWrapper.adopt([
			new Element('input', {
				'type' : 'text',
				'placeholder' : options.placeholder,
				'data-bind' : "value: value, visible: isEdit(), valueUpdate: 'keyup'"
			}),
			new Element('div', {
				'data-bind' : "text: value, visible: !isEdit() && value()"
			}),
			new Element('div',{
				'class' : 'text-holder',
				'data-bind' : "visible: !isEdit() && !value()",
				'text' : options.textHolder
			})
		]);
		// Autolist Wrap
		customElement.grab(autoDropList);
		autoDropList.grab(
			new Element('ul', {
				'data-bind' : "foreach: autoCompleteValues"
			}).grab(new Element('li').grab(new Element('a',{
				'href' : 'javascript:void(0)',
				'data-bind' : "text: $data.text, click: $parent.autoCompleteSelect"
			})))
		);

		element.grab(customElement);
	}

	// Element View Model
	function initViewModel(options, customInput) {
		var viewModel = {
				completeValues : ko.observableArray(options.autoValues || []),
				isEdit : ko.observable(false),
				isAutoComplete : ko.observable(options.autoComplete || false),
				showAutoComplete : ko.observable(false)
			};
			var _value = ko.observable();

			viewModel['value'] = ko.computed({
				read : function() {
					var value = _value();
					if($type(value) === 'object') {
						return value.text;
					} else {
						return value;
					}
				},
				write: function(newValue) {
					_value(newValue);
				}
			});

			viewModel['rawValue'] = function() {
				return _value();
			};

			viewModel['autoCompleteValues'] = ko.computed(function(){
				var value = viewModel.value();
		        var words = value ? value.split(' ') : [];
		        var values = [];

			        words.each(function(word){
			            if(word == "") return;
			            viewModel.completeValues().each(function(item){
			                var value = ($type(item) === 'object') ? item.text : item;
			                //var word = word.toLowerCase();

			                if(value.toLowerCase().indexOf(word.toLowerCase()) != -1) {
			                    if(values.indexOf(item) == -1) {
			                        values.push(item);
			                    }
			                }
			            });
			        })

			        //console.log('Auto Complete Values: ', words, values, value);

			        return values;
			});

			viewModel['hasValues'] = ko.computed(function(){
		        var isAutoComplete = viewModel.isAutoComplete();
		        var values = viewModel.autoCompleteValues();

		        	return isAutoComplete && (values.length > 0)
		    });

		    viewModel['autoCompleteSelect'] = function() {
		        var item = this;
		        viewModel.value(this);
		        viewModel.showAutoComplete(false);
		        customInput.fireEvent('selectValue', item);
		    };

		    // Subscribes
		    viewModel.value.subscribe(function(newValue){
		        if(viewModel.showAutoComplete() == false) {
		            viewModel.showAutoComplete(true);
		        }
		    });

			return viewModel;
	};

	// Knockout Custom bindingHandler
	ko.bindingHandlers.customInputHasFocus = {
	    init: function(element, valueAccessor, allBindingsAccessor, data, context) {
	        var inputEl = element.getElement('input');
	        
	        // Hanlder Element click event
	        element.addEvent('click', function(){
	        	var flag = valueAccessor(); 
	            flag(true);

	            inputEl.setAttribute('tabIndex', 0);
	            inputEl.focus();
	            inputEl.setSelectionRange(0, inputEl.value.length);
	        });
	        // Handler Input blur event
	        inputEl.addEvent('blur', function(){
	        	var flag = valueAccessor(); flag(false);
	        });
	    },
	    update: function(element, valueAccessor, allBindingsAccessor, data, context) {
	        
	    }
	};


	var CustomInput = new Class({
		Implements : [Options, Events],
		options : {
			element : null,
			textHolder : '..click for edit..',
			placeholder : 'Enter text...',
			autoComplete : false,
			autoValues: [],
			onSelectValue : $empty
		},
		viewModel : null,

		initialize : function(options) {
			var self = this;
			self.setOptions(options);

			self.viewModel = initViewModel(self.options, self);
			createHTML(self.options);

			ko.applyBindings(self.viewModel, self.options.element);
			options.element.store('custom-input', self);
		},
		getValue : function(text) {
			return (!text) ? this.viewModel.rawValue() : this.viewModel.value();
		},
		setValue : function(value) {
			this.viewModel.value(value);
		}
	});

	// Export
	w.lfk = w.lfk || {};
	w.lfk['CustomInput'] = CustomInput;
})(this);