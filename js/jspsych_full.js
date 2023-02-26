/**
 * jspsych.js
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 *
* jsPsych documentation: docs.jspsych.org
* de Leeuw, J. R. (2014). jsPsych: A JavaScript library for creating behavioral 
* experiments in a Web browser. Behavior research methods, 1-12
*
* Some modifications for CREx experiments can be found along the script by searching "CREx" 
* Initial jspsych.js is version 4.3 (2014)
* CREx-BLRI-AMU
* https://github.com/blri/Online_experiments_jsPsych
* 2016-12-13 christelle.zielinski@blri.fr
**/
 
			
(function($) {
	jsPsych = (function() {

		var core = {};

		//
		// private variables
		//
		// options
		var opts = {};
		// exp structure
		var root_chunk;
		// flow control
		var curr_chunk = 0;
		var global_trial_index = 0;
		var current_trial = {};
		// target DOM element
		var DOM_target;
		// time that the experiment began
		var exp_start_time;

		//
		// public methods
		//
		
		core.init = function(options) {

			// reset variables
			root_chunk = {};
			opts = {};
			curr_chunk = 0;

			// check if there is a body element on the page
			var default_display_element = $('body');
			if (default_display_element.length === 0) {
				$(document.documentElement).append($('<body>'));
				default_display_element = $('body');
			}

			var defaults = {
				'display_element': default_display_element,
				'on_finish': function(data) {
					return undefined;
				},
				'on_trial_start': function() {
					return undefined;
				},
				'on_trial_finish': function() {
					return undefined;
				},
				'on_data_update': function(data) {
					return undefined;
				},
				'show_progress_bar': false,
				'max_load_time': 30000,
				'skip_load_check': true /*CRExmod*/
			};

			// override default options if user specifies an option
			opts = $.extend({}, defaults, options);

			// set target
			DOM_target = opts.display_element;

			// add CSS class to DOM_target
			DOM_target.addClass('jspsych-display-element');

			// create experiment structure
			root_chunk = parseExpStructure(opts.experiment_structure);

			// wait for everything to load
			if(opts.skip_load_check){
				startExperiment();
			} else {
				allLoaded(startExperiment, opts.max_load_time);
			}
		};

		core.progress = function() {

			var obj = {
				"total_trials": root_chunk.length(),
				"current_trial_global": global_trial_index,
				"current_trial_local": root_chunk.currentTrialLocalIndex(),
				"total_chunks": root_chunk.timeline.length,
				"current_chunk": root_chunk.currentTimelineLocation
			};

			return obj;
		};

		core.startTime = function() {
			return exp_start_time;
		};

		core.totalTime = function() {
			return (new Date()).getTime() - exp_start_time.getTime();
		};

		core.preloadImages = function(images, callback_complete, callback_load) {

			// flatten the images array
			images = flatten(images);

			var n_loaded = 0;
			var loadfn = (typeof callback_load === 'undefined') ? function() {} : callback_load;
			var finishfn = (typeof callback_complete === 'undefined') ? function() {} : callback_complete;

			for (var i = 0; i < images.length; i++) {
				var img = new Image();

				img.onload = function() {
					n_loaded++;
					loadfn(n_loaded);
					if (n_loaded == images.length) {
						finishfn();
					}
				};

				img.src = images[i];
			}
		};

		core.getDisplayElement = function() {
			return DOM_target;
		};

		core.finishTrial = function(){
			// logic to advance to next trial?

			// handle callback at plugin level
			if (typeof current_trial.on_finish === 'function') {
				var trial_data = jsPsych.data.getDataByTrialIndex(global_trial_index);
				current_trial.on_finish(trial_data);
			}

			// handle callback at whole-experiment level
			opts.on_trial_finish();

			// if timing_post_trial is a function, evaluate it

			var time_gap = (typeof current_trial.timing_post_trial == 'function') ? current_trial.timing_post_trial() : current_trial.timing_post_trial;

			if(time_gap > 0){
				setTimeout(next_trial, time_gap);
			} else {
				next_trial();
			}

			function next_trial(){
				global_trial_index++;

				// advance chunk
				root_chunk.advance();

				// update progress bar if shown
				if (opts.show_progress_bar === true) {
					updateProgressBar();
				}

				// check if experiment is over
				if(root_chunk.isComplete()){
					finishExperiment();
					return;
				}

				doTrial(root_chunk.next());
			}
		};

		core.endExperiment = function(){
			root_chunk.end();
		}

		core.endCurrentChunk = function(){
			root_chunk.endCurrentChunk();
		}

		core.currentTrial = function(){
			return current_trial;
		};

		core.initSettings = function(){
			return opts;
		};

		core.currentChunkID = function(){
			return root_chunk.activeChunkID();
		};

		function allLoaded(callback, max_wait){

			var refresh_rate = 1000;
			var max_wait = max_wait || 30000;
			var start = (new Date()).getTime();

			var interval = setInterval(function(){
				if(jsPsych.pluginAPI.audioLoaded()){
					clearInterval(interval);
					callback();
				} else if((new Date()).getTime() - max_wait > start){
					console.error('Experiment failed to load all resouces in time alloted');
				}
			}, refresh_rate);

		}

		function parseExpStructure(experiment_structure) {
			
			if(!Array.isArray(experiment_structure)){
				throw new Error("Invalid experiment structure. Experiment structure must be an array");
			}

			return createExperimentChunk({
				chunk_type: 'root',
				timeline: experiment_structure
			});

		}

		function createExperimentChunk(chunk_definition, parent_chunk, relative_id){

			var chunk = {};

			chunk.timeline = parseChunkDefinition(chunk_definition.timeline);
			chunk.parentChunk = parent_chunk;
			chunk.relID = relative_id;

			chunk.type = chunk_definition.chunk_type; // root, linear, while, if

			chunk.currentTimelineLocation = 0;
			// this is the current trial since the last time the chunk was reset
			chunk.currentTrialInTimeline = 0;
			// this is the current trial since the chunk started (incl. resets)
			chunk.currentTrialInChunk = 0;
			// flag that indicates the chunk is done; overrides loops and ifs
			chunk.done = false;

			chunk.iteration = 0;

			chunk.length = function(){
				// this will recursively get the number of trials on this chunk's timeline
				var n = 0;
				for(var i=0; i<this.timeline.length; i++){
					n += this.timeline[i].length;
				}
				return n;
			};

			chunk.activeChunkID = function(){
				if(this.timeline[this.currentTimelineLocation].type === 'block'){
					return this.chunkID();
				} else {
					return this.timeline[this.currentTimelineLocation].activeChunkID();
				}
			};

			chunk.endCurrentChunk = function(){
				if(this.timeline[this.currentTimelineLocation].type === 'block'){
					this.end();
				} else {
					this.timeline[this.currentTimelineLocation].endCurrentChunk();
				}
			}

			chunk.chunkID = function() {

				if(typeof this.parentChunk === 'undefined') {
					return 0 + "-" + this.iteration;
				} else {
					return this.parentChunk.chunkID() + "." + this.relID + "-" + this.iteration;
				}

			};

			chunk.next = function() {
				// return the next trial in the block to be run

				// 'if' chunks might need their conditional_function evaluated
				if(this.type == 'if' && this.currentTimelineLocation == 0){
					if(!chunk_definition.conditional_function()){
						this.end();
						this.parentChunk.advance();
						return this.parentChunk.next();
					}
				} 
					return this.timeline[this.currentTimelineLocation].next();
			};

			chunk.end = function(){
				// end the chunk no matter what
				chunk.done = true;
			}

			chunk.advance = function(){
				// increment the current trial in the chunk

				this.timeline[this.currentTimelineLocation].advance();

				while(this.currentTimelineLocation < this.timeline.length &&
					this.timeline[this.currentTimelineLocation].isComplete()){
					this.currentTimelineLocation++;
				}

				this.currentTrialInTimeline++;
				this.currentTrialInChunk++;

			};

			chunk.isComplete = function() {
				// return true if the chunk is done running trials
				// return false otherwise

				// if done flag is set, then we're done no matter what
				if(this.done) { return true; }

				// linear chunks just go through the timeline in order and are
				// done when each trial has been completed once
				// the root chunk is a special case of the linear chunk
/*------- Remove 'if' case (see below)		*/
/* PREV : if(this.type == 'linear' || this.type == 'root' || this.type == 'if'){ */
				if(this.type == 'linear' || this.type == 'root'){
					if (this.currentTimelineLocation >= this.timeline.length) { return true; }
					else { return false; }
				}

				// while chunks play the block again as long as the continue_function
				// returns true
				else if(this.type == 'while'){
					if (this.currentTimelineLocation >= this.timeline.length) {

						if(chunk_definition.continue_function(this.generatedData())){
							this.reset();
							return false;
						} else {
							return true;
						}

					} else {
						return false;
					}
				}
/*------- THIS PART was commented in the new jspsych version*/
/* but a bug appeared when a conditional chunk ('if') has been defined inside a 'while' chunk */
				else if(this.type == 'if'){
					if(this.currentTimelineLocation >= this.timeline.length){
						return true;
					}

					if(this.currentTimelineLocation == 0){
						if(chunk_definition.conditional_function()){
							return false;
						} else {
							return true;
						}
					} else {
						return false;
					}
				}
/*-------*/
			};

			chunk.currentTrialLocalIndex = function() {

				if(this.currentTimelineLocation >= this.timeline.length) {
					return -1;
				}

				if(this.timeline[this.currentTimelineLocation].type == 'block'){
					return this.timeline[this.currentTimelineLocation].trial_idx;
				} else {
					return this.timeline[this.currentTimelineLocation].currentTrialLocalIndex();
				}
			};

			chunk.generatedData = function() {
				// return an array containing all of the data generated by this chunk for this iteration
				var d = jsPsych.data.getTrialsFromChunk(this.chunkID());
				return d;
			};

			chunk.reset = function() {
				this.currentTimelineLocation = 0;
				this.currentTrialInTimeline = 0;
				this.done = false;
				this.iteration++;
				for(var i = 0; i < this.timeline.length; i++){
					this.timeline[i].reset();
				}
			};

			function parseChunkDefinition(chunk_timeline){

				var timeline = [];

				for (var i = 0; i < chunk_timeline.length; i++) {


					var ct = chunk_timeline[i].chunk_type;

					if(typeof ct !== 'undefined') {

						if($.inArray(ct, ["linear", "while", "if"]) > -1){
							timeline.push(createExperimentChunk(chunk_timeline[i], chunk, i));
						} else {
							throw new Error('Invalid experiment structure definition. Element of the experiment_structure array has an invalid chunk_type property');
						}

					} else {
						// create a terminal block ...
						// check to make sure plugin is loaded
						var plugin_name = chunk_timeline[i].type;
						if (typeof chunk_timeline[i].type === 'undefined'){
							throw new Error("Invalid experiment structure definition. One or more trials is missing a 'type' parameter.");
						}
						if (typeof jsPsych[plugin_name] === 'undefined') {
							throw new Error("Failed attempt to create trials using plugin type " + plugin_name + ". Is the plugin loaded?");
						}

						var trials = jsPsych[plugin_name].create(chunk_timeline[i]);

						// add chunk level data to all trials
						if(typeof chunk_definition.data !== 'undefined'){
							for(t in trials){
								trials[t].data = chunk_definition.data;
							}
						}

						// add block/trial level data to all trials
						trials = addParamToTrialsArr(trials, chunk_timeline[i].data, 'data', undefined, true);

						// add options that are generic to all plugins
						trials = addGenericTrialOptions(trials, chunk_timeline[i]);

						// setting default values for repetitions and randomize_order
						var randomize_order = (typeof chunk_timeline[i].randomize_order === 'undefined') ? false : chunk_timeline[i].randomize_order;
						var repetitions = (typeof chunk_timeline[i].repetitions === 'undefined') ? 1 : chunk_timeline[i].repetitions;

						for(var j = 0; j < repetitions; j++) {
							timeline.push(createBlock(trials, randomize_order));
						}
					}
				}

				return timeline;
			}

			return chunk;

		}

		function createBlock(trial_list, randomize_order) {

			var block = {

				trial_idx: 0,

				trials: trial_list,

				type: 'block',

				randomize_order: randomize_order,

				next: function() {

					// stuff that happens when the block is running from the start
					if(this.trial_idx === 0){
						if(this.randomize_order){
							this.trials = jsPsych.randomization.repeat(this.trials, 1, false);
						}
					}

					var curr_trial = this.trials[this.trial_idx];

					return curr_trial;

				},

				isComplete: function() {
					if(this.trial_idx >= this.trials.length){
						return true;
					} else {
						return false;
					}
				},

				advance: function() {
					this.trial_idx++;
				},

				reset: function() {
					this.trial_idx = 0;
				},

				length: trial_list.length
			};

			return block;
		}

		function startExperiment() {

			// show progress bar if requested
			if (opts.show_progress_bar === true) {
				drawProgressBar();
			}

			// record the start time
			exp_start_time = new Date();

			// begin!
			doTrial(root_chunk.next());
		}

		function addGenericTrialOptions(trials_arr, opts) {

			// modify this list to add new generic parameters
			var genericParameters = ['type', 'timing_post_trial', 'on_finish'];

			// default values for generics above
			var defaultValues = [, 500, ];

			for (var i = 0; i < genericParameters.length; i++) {
				trials_arr = addParamToTrialsArr(trials_arr, opts[genericParameters[i]], genericParameters[i], defaultValues[i], false);
			}

			return trials_arr;

		}

		function addParamToTrialsArr(trials_arr, param, param_name, default_value, extend) {

			if (typeof default_value !== 'undefined') {
				param = (typeof param === 'undefined') ? default_value : param;
			}

			if (typeof param !== 'undefined') {
				if (Array.isArray(param)) {
					// check if parameter setting is the same length as the number of trials
					if (param.length != trials_arr.length) {
						throw new Error('Invalid specification of parameter ' + param_name + ' in plugin type ' + trials_arr[i].type + '. Length of parameter array does not match the number of trials in the block.');
					} else {
						for (var i = 0; i < trials_arr.length; i++) {
							if(extend && typeof trials_arr[i][param_name] !== 'undefined'){
								trials_arr[i][param_name] = $.extend({}, trials_arr[i][param_name], param[i])
							} else {
								trials_arr[i][param_name] = param[i];
							}
						}
					}
				} else {
					// use the same data object for each trial
					for (var i = 0; i < trials_arr.length; i++) {
						if(extend && typeof trials_arr[i][param_name] !== 'undefined'){
							trials_arr[i][param_name] = $.extend({}, trials_arr[i][param_name], param)
						} else {
							trials_arr[i][param_name] = param;
						}
					}
				}
			}
			return trials_arr;
		}

		function finishExperiment() {
			opts.on_finish(jsPsych.data.getData());
		}

		function doTrial(trial) {

			current_trial = trial;

			// call experiment wide callback
			opts.on_trial_start();

			// execute trial method
			jsPsych[trial.type].trial(DOM_target, trial);
		}

		function drawProgressBar() {
			$('body').prepend($('<div id="jspsych-progressbar-container"><span>Completion Progress</span><div id="jspsych-progressbar-outer"><div id="jspsych-progressbar-inner"></div></div></div>'));
		}

		function updateProgressBar() {
			var progress = jsPsych.progress();

			var percentComplete = 100 * ((progress.current_chunk) / progress.total_chunks);

			$('#jspsych-progressbar-inner').css('width', percentComplete + "%");
		}

		return core;
	})();

	jsPsych.data = (function() {

		var module = {};

		// data storage object
		var allData = [];

		// data properties for all trials
		var dataProperties = {};

		module.getData = function() {
			return $.extend(true, [], allData); // deep clone
		};

		module.write = function(data_object) {

			var progress = jsPsych.progress();
			var trial = jsPsych.currentTrial();

			var trial_opt_data = typeof trial.data == 'function' ? trial.data() : trial.data;

			var default_data = {
				'type': trial.type,
				'icur': progress.current_trial_local,
				'iG': progress.current_trial_global,
				'tG': jsPsych.totalTime()
			};

			// CREx - HowFast project - remove unused fields :
			// 'internal_chunk_id': jsPsych.currentChunkID()
			// Change "trial_type" to "type"
			// time_elapsed => tG
			// trial_index_global => iG
			// finally, remove 'trial_pos_inblock': progress.current_trial_local + 1,
			// because same thing as (icur + 1)
			
			var ext_data_object = $.extend({}, default_data, dataProperties, data_object, trial_opt_data);
			// CREx modif 150831 - avoid data_object property to be overide by default_data
			// PREVIOUS : var ext_data_object = $.extend({}, data_object, trial_opt_data, default_data, dataProperties);

			allData.push(ext_data_object);

			var initSettings = jsPsych.initSettings();
			initSettings.on_data_update(ext_data_object);
		};

		module.addProperties = function(properties){

			// first, add the properties to all data that's already stored
			for(var i=0; i<allData.length; i++){
				for(var key in properties){
					allData[i][key] = properties[key];
				}
			}

			// now add to list so that it gets appended to all future data
			dataProperties = $.extend({}, dataProperties, properties);
		};

		module.addDataToLastTrial = function(data){
			if(allData.length == 0){
				throw new Error("Cannot add data to last trial - no data recorded so far");
			}
			allData[allData.length-1] = $.extend({},allData[allData.length-1],data);
		}

		module.dataAsCSV = function() {
			var dataObj = module.getData();
			return JSON2CSV(dataObj);
		};

		module.localSave = function(filename, format) {

			var data_string;

			if (format == 'JSON' || format == 'json') {
				data_string = JSON.stringify(module.getData());
			} else if (format == 'CSV' || format == 'csv') {
				data_string = module.dataAsCSV();
			} else {
				throw new Error('invalid format specified for jsPsych.data.localSave');
			}

			saveTextToFile(data_string, filename);
		};

		module.getTrialsOfType = function(trial_type) {
			var data = module.getData();

			data = flatten(data);

			var trials = [];
			for (var i = 0; i < data.length; i++) {
				if (data[i].type == trial_type) {
					trials.push(data[i]);
				}
			}

			return trials;
		};

		module.getTrialsFromChunk = function(chunk_id) {
			var data = module.getData();

			data = flatten(data);

			var trials = [];
			for (var i = 0; i < data.length; i++) {
				if (data[i].internal_chunk_id.slice(0, chunk_id.length) === chunk_id) {
					trials.push(data[i]);
				}
			}

			return trials;
		};

		module.getLastTrialData = function() {
			if(allData.length == 0){
				return {};
			}
			return allData[allData.length-1];
		};

		module.getDataByTrialIndex = function(trial_index) {
			for(var i = 0; i<allData.length; i++){
				if(allData[i].iG == trial_index){
					return allData[i];
				}
			}
			return undefined;
		}

		module.getLastChunkData = function() {
			var lasttrial = module.getLastTrialData();
			var chunk_id = lasttrial.internal_chunk_id;
			if(typeof chunk_id === 'undefined') {
				return [];
			} else {
				var lastchunkdata = module.getTrialsFromChunk(chunk_id);
				return lastchunkdata;
			}
		}

		module.displayData = function(format) {
			format = (typeof format === 'undefined') ? "json" : format.toLowerCase();
			if (format != "json" && format != "csv") {
				console.log('Invalid format declared for displayData function. Using json as default.');
				format = "json";
			}

			var data_string;

			if (format == 'json') {
				data_string = JSON.stringify(module.getData(), undefined, 1);
			} else {
				data_string = module.dataAsCSV();
			}

			var display_element = jsPsych.getDisplayElement();

			display_element.append($('<pre id="jspsych-data-display"></pre>'));

			$('#jspsych-data-display').text(data_string);
		};

		// private function to save text file on local drive

		function saveTextToFile(textstr, filename) {
			var blobToSave = new Blob([textstr], {
				type: 'text/plain'
			});
			var blobURL = "";
			if (typeof window.webkitURL !== 'undefined') {
				blobURL = window.webkitURL.createObjectURL(blobToSave);
			} else {
				blobURL = window.URL.createObjectURL(blobToSave);
			}

			var display_element = jsPsych.getDisplayElement();

			display_element.append($('<a>', {
				id: 'jspsych-download-as-text-link',
				href: blobURL,
				css: {
					display: 'none'
				},
				download: filename,
				html: 'download file'
			}));
			$('#jspsych-download-as-text-link')[0].click();
		}

		//
		// A few helper functions to handle data format conversion
		//

		// this function based on code suggested by StackOverflow users:
		// http://stackoverflow.com/users/64741/zachary
		// http://stackoverflow.com/users/317/joseph-sturtevant

		function JSON2CSV(objArray) {
			var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
			var line = '';
			var result = '';
			var columns = [];

			var i = 0;
			for (var j = 0; j < array.length; j++) {
				for (var key in array[j]) {
					var keyString = key + "";
					keyString = '"' + keyString.replace(/"/g, '""') + '",';
					if ($.inArray(key, columns) == -1) {
						columns[i] = key;
						line += keyString;
						i++;
					}
				}
			}

			line = line.slice(0, -1);
			result += line + '\r\n';

			for (var i = 0; i < array.length; i++) {
				var line = '';
				for (var j = 0; j < columns.length; j++) {
					var value = (typeof array[i][columns[j]] === 'undefined') ? '' : array[i][columns[j]];
					var valueString = value + "";
					line += '"' + valueString.replace(/"/g, '""') + '",';
				}

				line = line.slice(0, -1);
				result += line + '\r\n';
			}

			return result;
		}

		return module;

	})();
	
	jsPsych.randomization = (function() {

		var module = {};

		module.repeat = function(array, repetitions, unpack) {

			var arr_isArray = Array.isArray(array);
			var rep_isArray = Array.isArray(repetitions);

			// if array is not an array, then we just repeat the item
			if (!arr_isArray) {
				if (!rep_isArray) {
					array = [array];
					repetitions = [repetitions];
				} else {
					repetitions = [repetitions[0]];
					console.log('Unclear parameters given to randomization.repeat. Multiple set sizes specified, but only one item exists to sample. Proceeding using the first set size.');
				}
			} else {
				if (!rep_isArray) {
					var reps = [];
					for (var i = 0; i < array.length; i++) {
						reps.push(repetitions);
					}
					repetitions = reps;
				} else {
					if (array.length != repetitions.length) {
						console.warning('Unclear parameters given to randomization.repeat. Items and repetitions are unequal lengths. Behavior may not be as expected.');
						// throw warning if repetitions is too short, use first rep ONLY.
						if(repetitions.length < array.length){
							var reps = [];
							for (var i = 0; i < array.length; i++) {
								reps.push(repetitions);
							}
							repetitions = reps;
						} else {
							// throw warning if too long, and then use the first N
							repetitions = repetions.slice(0, array.length);
						}
					}
				}
			}

			// should be clear at this point to assume that array and repetitions are arrays with == length
			var allsamples = [];
			for (var i = 0; i < array.length; i++) {
				for (var j = 0; j < repetitions[i]; j++) {
					allsamples.push(array[i]);
				}
			}

			var out = shuffle(allsamples);

			if (unpack) {
				out = unpackArray(out);
			}

			return shuffle(out);
		}

		module.shuffle = function(arr) {
			return shuffle(arr);
		}

		module.shuffleNoRepeats = function(arr, equalityTest){
				// define a default equalityTest
				if(typeof equalityTest == 'undefined'){
					equalityTest = function(a,b){
						if(a === b) { return true; }
						else { return false; }
					}
				}

				var random_shuffle = shuffle(arr);
				for(var i=0; i<random_shuffle.length-2; i++){
					if(equalityTest(random_shuffle[i], random_shuffle[i+1])){
						// neighbors are equal, pick a new random neighbor to swap (not the first or last element, to avoid edge cases)
						var random_pick = Math.floor(Math.random()*(random_shuffle.length-2))+1;
						// test to make sure the new neighbor isn't equal to the old one
						while(
							equalityTest(random_shuffle[i+1], random_shuffle[random_pick]) ||
							(equalityTest(random_shuffle[i+1], random_shuffle[random_pick+1]) || equalityTest(random_shuffle[i+1], random_shuffle[random_pick-1]))
						){
							random_pick = Math.floor(Math.random()*(random_shuffle.length-2))+1;
						}
						var new_neighbor = random_shuffle[random_pick];
						random_shuffle[random_pick] = random_shuffle[i+1];
						random_shuffle[i+1] = new_neighbor;
					}
				}

				return random_shuffle;
		}

		module.sample = function(arr, size, withReplacement) {
			if(withReplacement == false) {
				if(size > arr.length){
					console.error("jsPsych.randomization.sample cannot take a sample "+
					"larger than the size of the set of items to sample from when "+
					"sampling without replacement.");
				}
			}
			var samp = [];
			var shuff_arr = shuffle(arr);
			for(var i=0; i<size; i++){
				if(!withReplacement){
					samp.push(shuff_arr.pop());
				} else {
					samp.push(shuff_arr[Math.floor(Math.random()*shuff_arr.length)]);
				}
			}
			return samp;
		}

		module.factorial = function(factors, repetitions, unpack) {

			var factorNames = Object.keys(factors);

			var factor_combinations = [];

			for (var i = 0; i < factors[factorNames[0]].length; i++) {
				factor_combinations.push({});
				factor_combinations[i][factorNames[0]] = factors[factorNames[0]][i];
			}

			for (var i = 1; i < factorNames.length; i++) {
				var toAdd = factors[factorNames[i]];
				var n = factor_combinations.length;
				for (var j = 0; j < n; j++) {
					var base = factor_combinations[j];
					for (var k = 0; k < toAdd.length; k++) {
						var newpiece = {};
						newpiece[factorNames[i]] = toAdd[k];
						factor_combinations.push($.extend({}, base, newpiece));
					}
				}
				factor_combinations.splice(0, n);
			}

			repetitions = (typeof repetitions === 'undefined') ? 1 : repetitions;
			var with_repetitions = module.repeat(factor_combinations, repetitions, unpack);

			return with_repetitions;
		}

		function unpackArray(array) {

			var out = {};

			for (var i = 0; i < array.length; i++) {
				var keys = Object.keys(array[i]);
				for (var k = 0; k < keys.length; k++) {
					if (typeof out[keys[k]] === 'undefined') {
						out[keys[k]] = [];
					}
					out[keys[k]].push(array[i][keys[k]]);
				}
			}

			return out;
		}

		function shuffle(array) {
			var m = array.length,
				t, i;

			// While there remain elements to shuffle…
			while (m) {

				// Pick a remaining element…
				i = Math.floor(Math.random() * m--);

				// And swap it with the current element.
				t = array[m];
				array[m] = array[i];
				array[i] = t;
			}

			return array;
		}

		return module;

	})();

	jsPsych.pluginAPI = (function() {

		/* for future centralized key handling... */
		/*$(document).on('keydown', keyHandler);

		function keyHandler(e){

			// record time

			// dispatch events

		}*/

		// keyboard listeners
		var keyboard_listeners = [];

		var held_keys = [];

		var module = {};

		module.getKeyboardResponse = function(parameters){
			//parameters are: callback_function, valid_responses, rt_method, persist, audio_context, audio_context_start_time, allow_held_key?

			var start_time;
			// start_time = (new Date()).getTime();
			start_time = performance.now();
			
			var listener_id;

			var listener_function = function(e) {

				var key_time;
				// key_time = (new Date()).getTime();		
				key_time = performance.now();
				var t_up;	
				
				var valid_response = (typeof parameters.valid_responses === 'undefined' || parameters.valid_responses.length === 0) ? true : false;

				for (var i = 0; i < parameters.valid_responses.length; i++) {
					if (typeof parameters.valid_responses[i] == 'string') {
						if (typeof keylookup[parameters.valid_responses[i]] !== 'undefined') {
							if (e.which == keylookup[parameters.valid_responses[i]]) {
								valid_response = true;
							}
						} else {
							throw new Error('Invalid key string specified for getKeyboardResponse');
						}
					} else if (e.which == parameters.valid_responses[i]) {
						valid_response = true;
					}
				}
				// check if key was already held down

				if ( ((typeof parameters.allow_held_key == 'undefined') || !parameters.allow_held_key) && valid_response ) {
					for(i in held_keys){
						if(held_keys[i]==e.which){
							valid_response = false;
							break;
						}
					}
				}
				if (valid_response) {
					//alert(t_up);
					held_keys.push(e.which);
					parameters.callback_function({
						key: e.which,
						rt: key_time - start_time,
						dur: t_up - key_time
					});
					if ($.inArray(listener_id, keyboard_listeners) > -1) {

						if (!parameters.persist) {
							// remove keyboard listener
							module.cancelKeyboardResponse(listener_id);
						}
					}
					var after_up = function(up) {
						t_up = (new Date()).getTime();
						//alert(t_up);
						if (up.which == e.which) {
							$(document).off('keyup', after_up); 

							// mark key as released
							held_keys.splice($.inArray(e.which, held_keys), 1);
						}
					};
					$(document).keyup(after_up);
				}
			};

			$(document).keydown(listener_function); 

			// create listener id object
			listener_id = {
				type: 'keydown',
				fn: listener_function
			};

			// add this keyboard listener to the list of listeners
			keyboard_listeners.push(listener_id);

			return listener_id;

		};

		module.cancelKeyboardResponse = function(listener) {
			// remove the listener from the doc
			$(document).off(listener.type, listener.fn);

			// remove the listener from the list of listeners
			if ($.inArray(listener, keyboard_listeners) > -1) {
				keyboard_listeners.splice($.inArray(listener, keyboard_listeners), 1);
			}
		};

		module.cancelAllKeyboardResponses = function() {
			for (var i = 0; i < keyboard_listeners.length; i++) {
				$(document).off(keyboard_listeners[i].type, keyboard_listeners[i].fn);
			}
			keyboard_listeners = [];
		};

		module.convertKeyCharacterToKeyCode = function(character){
			var code;
			if(typeof keylookup[character] !== 'undefined'){
				code = keylookup[character];
			}
			return code;
		}

		// keycode lookup associative array
		var keylookup = {
			'backspace': 8,
			'tab': 9,
			'enter': 13,
			'shift': 16,
			'ctrl': 17,
			'alt': 18,
			'pause': 19,
			'capslock': 20,
			'esc': 27,
			'space': 32,
			'spacebar': 32,
			' ': 32,
			'pageup': 33,
			'pagedown': 34,
			'end': 35,
			'home': 36,
			'leftarrow': 37,
			'uparrow': 38,
			'rightarrow': 39,
			'downarrow': 40,
			'insert': 45,
			'delete': 46,
			'0': 48,
			'1': 49,
			'2': 50,
			'3': 51,
			'4': 52,
			'5': 53,
			'6': 54,
			'7': 55,
			'8': 56,
			'9': 57,
			'a': 65,
			'b': 66,
			'c': 67,
			'd': 68,
			'e': 69,
			'f': 70,
			'g': 71,
			'h': 72,
			'i': 73,
			'j': 74,
			'k': 75,
			'l': 76,
			'm': 77,
			'n': 78,
			'o': 79,
			'p': 80,
			'q': 81,
			'r': 82,
			's': 83,
			't': 84,
			'u': 85,
			'v': 86,
			'w': 87,
			'x': 88,
			'y': 89,
			'z': 90,
			'A': 65,
			'B': 66,
			'C': 67,
			'D': 68,
			'E': 69,
			'F': 70,
			'G': 71,
			'H': 72,
			'I': 73,
			'J': 74,
			'K': 75,
			'L': 76,
			'M': 77,
			'N': 78,
			'O': 79,
			'P': 80,
			'Q': 81,
			'R': 82,
			'S': 83,
			'T': 84,
			'U': 85,
			'V': 86,
			'W': 87,
			'X': 88,
			'Y': 89,
			'Z': 90,
			'0numpad': 96,
			'1numpad': 97,
			'2numpad': 98,
			'3numpad': 99,
			'4numpad': 100,
			'5numpad': 101,
			'6numpad': 102,
			'7numpad': 103,
			'8numpad': 104,
			'9numpad': 105,
			'multiply': 106,
			'plus': 107,
			'minus': 109,
			'decimal': 110,
			'divide': 111,
			'F1': 112,
			'F2': 113,
			'F3': 114,
			'F4': 115,
			'F5': 116,
			'F6': 117,
			'F7': 118,
			'F8': 119,
			'F9': 120,
			'F10': 121,
			'F11': 122,
			'F12': 123,
			'=': 187,
			',': 188,
			'.': 190,
			'/': 191,
			'`': 192,
			'[': 219,
			'\\': 220,
			']': 221
		};

		module.evaluateFunctionParameters = function(trial, protect) {

			// keys that are always protected
			var always_protected = ['on_finish'];

			protect = (typeof protect === 'undefined') ? [] : protect;

			protect = protect.concat(always_protected);

			var keys = getKeys(trial);

			var tmp = {};
			for (var i = 0; i < keys.length; i++) {

				var process = true;
				for (var j = 0; j < protect.length; j++) {
					if (protect[j] == keys[i]) {
						process = false;
						break;
					}
				}

				if (typeof trial[keys[i]] == "function" && process) {
					tmp[keys[i]] = trial[keys[i]].call();
				} else {
					tmp[keys[i]] = trial[keys[i]];
				}

			}

			return tmp;

		};

		module.enforceArray = function(params, possible_arrays) {

			// function to check if something is an array, fallback
			// to string method if browser doesn't support Array.isArray
			var ckArray = Array.isArray || function(a) {
					return toString.call(a) == '[object Array]';
				};

			for (var i = 0; i < possible_arrays.length; i++) {
				if (typeof params[possible_arrays[i]] !== 'undefined') {
					params[possible_arrays[i]] = ckArray(params[possible_arrays[i]]) ? params[possible_arrays[i]] : [params[possible_arrays[i]]];
				}
			}
			return params;
		};

		function getKeys(obj) {
			var r = [];
			for (var k in obj) {
				if (!obj.hasOwnProperty(k)) continue;
				r.push(k);
			}
			return r;
		}
		return module;
	})();

	// methods used in multiple modules

	// private function to flatten nested arrays

	function flatten(arr, out) {
		out = (typeof out === 'undefined') ? [] : out;
		for (var i = 0; i < arr.length; i++) {
			if (Array.isArray(arr[i])) {
				flatten(arr[i], out);
			} else {
				out.push(arr[i]);
			}
		}
		return out;
	}

})(jQuery);
/** ---- end jsPsych **/

/**------------------------------------- ADDS-ON**/
/** subject_ID */
jsPsych.getSubjectID = (function() {
	
	/* Define subject ID (based on an accurate start date - millisecond order precision) */
	function datestr(sdat) {
		function formatstr(num, dignum){
			dignum = (typeof dignum =='undefined') ? 2 : dignum;
			var numstr = num.toString();
			if (numstr.length < dignum) {
				for (var j = 0 ; j < dignum - numstr.length ; j++) {				
					numstr = "0" + numstr;
				}
			}
			return numstr;
		}
		var sy = sdat.getFullYear();
		var smo = formatstr(sdat.getMonth()+1);
		var sda = formatstr(sdat.getDate());
		var sho = formatstr(sdat.getHours());
		var smi = formatstr(sdat.getMinutes());
		var sse = formatstr(sdat.getSeconds());
		var sms = formatstr(sdat.getMilliseconds(), 3);
		var strdat = sy + smo + sda + "_" + sho + smi + sse + "_" + sms;
		
		return strdat ;
	}

	return 'ID_' + datestr(new Date());
});

/** Prepare json data to be saved **/
jsPsych.prepare_data = function(){
	function concat_field_value(data, fields, concat_arr=false){
		var json_data = {};
		for (var i=0; i<data.length; i++){
			var trial_data = data[i];
			for (var j=0; j<fields.length; j++){
				var fnam = fields[j];
				var dat = trial_data[fnam];
				if (i==0){
					if(concat_arr && Array.isArray(dat)){
						json_data[fnam] = dat;
					}else{
						json_data[fnam] = [dat];
					}
				}else{
					if(concat_arr && Array.isArray(dat)){
						json_data[fnam] = json_data[fnam].concat(dat);
					}else{
						json_data[fnam].push(dat);
					}
				}
			}
		}
		return json_data;
	}
	
	// get all data
	var alldata = jsPsych.data.getData();	
	// those of type rating - exclude the first one == example
	var rating_data = jsPsych.data.getTrialsOfType('rating').slice(1);
	var fields = ["trial_num", "id_stim", "cat", "rt_click", "rt_resp", "comp", "fam", "beau", "meta"];
	rating_data = concat_field_value(rating_data, fields);
	// add the check trials
	var check_data = jsPsych.data.getTrialsOfType('check');
	check_data = concat_field_value(check_data, ["trial_num", "id_stim", "resp", "correct"]);
	// art data
	var art_data = jsPsych.data.getTrialsOfType('art');
	art_data = concat_field_value(art_data, ["id", "resp", "score"], true);
	// special case for response of form trial (object concatenation)
	var form_data = jsPsych.data.getTrialsOfType("form");
	var all_resp = {};
	for (var i=0; i<form_data.length; i++){
		var fdata = form_data[i];
		all_resp = Object.assign(all_resp, fdata.responses);
	}
	return {rating: rating_data, check: check_data, art: art_data, form: all_resp};	
};
/** Get the ART form score for feedback **/
jsPsych.getArtScore = function(){
	var art = jsPsych.data.getTrialsOfType('art');
	var nb_ok = 0;
	var nb_err = 0;
	var tot_score = 0;
	for (var i=0; i<art.length; i++){
		var part = art[i];
		for (var j=0; j<part.score.length; j++){
			if (part.score[j] === 1){
				nb_ok++;
			}
			if (part.score[j] === -1){
				nb_err++;
			}
			tot_score += part.score[j];
		}
		
	}
	console.log(art, {total: tot_score, author: nb_ok, error: nb_err});
	return {total: tot_score, author: nb_ok, error: nb_err};
};

/**
**  PLUGIN  **/
/**          **/

/**----------------------------------------- PLUGIN : form-author **/
(function($) {
	
	jsPsych['form-author'] = (function() {

		var plugin = {};

		plugin.create = function(params) {		
			// Check for form_struct parameters 
			params.timing_post_trial = 800;	
			return [params];
		};
		plugin.trial = function(display, trial) {
			
			// total number of authors
			var stim = trial.stim;
			var Nart = stim.length;
			// gather stim data as a {stim_id: val} object
			// to test for answer after submission
			var sval = {};
			
			display.html('<p id="author-instr">Rappel : cochez les auteurs dont vous êtes sûr.e.s.</p>')
			var k = 0;
			var $tab = $('<table />').attr('id', 'tab').addClass('author-table');
			display.append($tab);
			
			while (k < Nart){
				// make the row
				
				var $tr = $('<tr />').attr('id', 'tr_' + k);
				var row_id = '#tr_'+k;
				$('#tab').append($tr);
				// left column
				var sid = stim[k].id;
				var oth_left = '<th id="' + k + '"><label for="y' + k +'">' + stim[k].name + '</label><input type="checkbox" class="radio checkbox" value="y" id="y' + k + '" name="' + sid + '">' + '</th>';
	
				$(row_id).append(oth_left);
				sval[sid] = stim[k].val;
				k++;
				// right column
				if (k >= Nart){
					break;
				}
				var sid = stim[k].id;
				var oth_right = '<th id="' + k + '"><label for="y' + k +'">' +  stim[k].name + '</label><input type="checkbox" class="radio checkbox" value="y" id="y' + k + '" name="' + sid + '"></th>';
				
				$(row_id).append(oth_right);
				sval[sid] = stim[k].val;
				k++;
			}
			
			// submit button
			var $but = $('<div />')
				.addClass('button button-rating')
				.attr("id","submit")
				.html('<span>Valider</span>');					
			display.append($but);

			// collect data when submit
			$('#submit').click(function(){
				var all_id = [];
				var all_resp = [];
				var all_score = [];
				$('th').each(function(idx){
					var ist = parseInt($(this).attr('id'));
					var sid = stim[ist].id;
					// author id
					all_id.push(sid);
					// expected response
					var is_auth = sval[sid];
					// collect checked response
					var resp = 'NA';
					$('input[name="' + sid + '"]').each(function(){
						// case checked
						if ($(this).is(":checked") === true){
							resp = $(this).attr('value');
						}
					});
					all_resp.push(resp);
					// score 
					// case author checked
					if (resp==='y'){
						if (is_auth){
							all_score.push(1);
						}else{
							all_score.push(-1);
						}								
					}else{
						// ???
						all_score.push(0);
					}
				});
				// write data
				jsPsych.data.write({type: 'art', 
									id: all_id, 
									resp: all_resp, 
									score: all_score});
				display.html('');
				jsPsych.finishTrial();
			});
		};
		return plugin;
	})();
})(jQuery);
/** ---- end ART (author) PLUGIN **/
/** --------------------------------------------PLUGIN: form-rating **/
(function($) {
	
	jsPsych['form-rating'] = (function() {

		var plugin = {};

		plugin.create = function(params) {		
			// Check for form_struct parameters 
			params.timing_post_trial = 0;	
			return [params];
		};

		plugin.trial = function(display, trial) {
			
			// init variables
			var start_time;
			var istim = 0;
			var rt_click = 0;
			var rt_resp = 0;
			var nb_check = 0;
			// total number of stim
			var Nstim = trial.stim.length;
			
			// function to display the sentence + click event			
			function disp_stim_click(){
				var $stim = $('<div/>')
						.attr('id', 'stim')
						.html(trial.stim[istim].str);
				var $click_msg = $('<div/>')
					.attr('id', 'recall')
					.html('(cliquez sur la page pour valider)');
				display.append($stim, $click_msg);
				start_time = performance.now();
				nb_check = 0;
				// start mouse listener
				var mouse_listener = function(e) {
					rt_click = Math.round(performance.now() - start_time);
					$('html').unbind('click', mouse_listener);
					disp_rating(trial.rating);
				};
				// prevent unrealistic click
				setTimeout(function(){
					$('html').click(mouse_listener);}, 400);
			}
			function disp_tab_rating(form_arr){
				var Nquest = form_arr.length;
				for (var i=0; i<Nquest; i++){
					var oquest = form_arr[i];
					var q_id = oquest.id;
					// question row
					var hdr_quest = '<div class="row"><div class="col-header" id="' +
								q_id + '">' +	oquest.quest + '</div></div>';
					// choices row
					var row_choice = '<div class="row" id="row-choice-'+ q_id + '"></div>';
					
					$('#rating-wrap').append(hdr_quest, row_choice);
					
					// add top line 
					if (i>0){
						$('#' + q_id).addClass('top-line');
					}
					// file the choice row	
					// left label
					$('#row-choice-' + q_id).append('<div class="column col-range col-left">' + oquest.opt_extlabel[0] + '</div>');
					
					// add the radio buttons + labels
					// choice-column+div
					var rad_col = '<div class="column col-radio"><div class="choice" id="all-choices-' + 
									q_id + '"></div></div>';
					$('#row-choice-' + q_id).append(rad_col);
					
					// loop/radio
					for (var j=0; j<oquest.opt_val.length; j++){
						var val = oquest.opt_val[j];
						var rid = q_id + val;
						var rstr = oquest.opt_str[j];
						var radio = '<label for="' + rid +'"><div class="radiv">' +
							'<input type="radio" class="radio" id="' + rid + '" value="' + val +
							'" name="' + q_id + '">' + rstr + '</div></label>';
						$('#all-choices-' + q_id).append(radio);
					}
					// right label
					$('#row-choice-' + q_id).append('<div class="column col-range col-right">' + oquest.opt_extlabel[1] + '</div>');	
					
					// add a counter: number of radio-choice div checked
					// display the validation button when all choice div have been checked at least one time
					$('#all-choices-' + q_id).one('change', function(){
						nb_check++;
						if (nb_check===Nquest){
							disp_button('Continuer !');
							// add click event 
							$('#submit').click(function(){
								submit_rating(form_arr);
							});
						}
					});
				}
			}
			// display button
			function disp_button(but_txt){
				// Add submit button			
				var $but = $('<div />')
						.addClass('button button-rating')
						.attr("id","submit")
						.html('<span>'+ but_txt + '</span>');					
				display.append($but);
			}
			
			// rating validation function
			var submit_rating = function(form_arr){
				// get rt
				rt_resp = Math.round(performance.now() - start_time);
				// check if all answers are given
				var resp = {};
				for (var i=0; i< form_arr.length; i++){
					var oquest = form_arr[i];
					var qid = oquest.id;
					var val = $('input[name="'+ qid+ '"]:checked').val();
					resp[qid] = parseInt(val);
				}		
				// write data
				var data = Object.assign({type: 'rating',
									trial_num: istim+1,
									id_stim: trial.stim[istim]['id'],
									cat: trial.stim[istim]['cat'],
									rt_click: rt_click,
									rt_resp: rt_resp}, resp);
				jsPsych.data.write(data);

				// go to the next task 
				display.html('');
				setTimeout(function(){
					// check-point question for specific trials
					if (trial.stim[istim]['check']===1){					
						disp_check();
					}else{	
					// next stimulus
						next_trial();
					}
				}, 800);
			};
			// display form rating
			// make it once as it is always the same
			function disp_rating(form_arr){
				// clear the page
				display.html('');				
				// rating table div
				var $form = $('<div/>')
					.attr('id', 'rating-wrap')
					.css('visibility', 'hidden');					
				display.append($form);				
				// disp tab with question and rating options + button when all choices done
				disp_tab_rating(form_arr);
				// show the form
				$('#rating-wrap').css('visibility', 'visible');
				// associated starting time
				start_time = performance.now();
			}
			
			//  display the next stimulus or finish the block
			var next_trial = function(){
				// next trial
				istim++;
				if (istim+1 > Nstim){
					display.html('');
					jsPsych.finishTrial();	
				}else{
					disp_stim_click();
				}
			};
			
			// check-point questions for some specific trials
			function disp_check(){
				var check_form = trial.check_form;
				var id_stim = trial.stim[istim].id;
				var check_stim = trial.check[id_stim];
				// disp the preamb
				display.append('<div class="check-header">' + check_form.quest + '</div>');
				// add wrapper
				display.append('<div id="check-wrap"></div>');
				// disp the choices
				for (var i=0; i<check_stim.opt_val.length; i++){
					var id_chk = (i+1).toString();
					var $p = $('<p/>').attr('id', 'p' + id_chk);
					var chkbox = '<input type="checkbox" id="' + id_chk 
						+ '" class="radio checkbox" value="' + check_stim.opt_val[i] + '">';
					var lab = '<label for="' + id_chk + '">' + check_stim.opt_str[i] + '</label>';
					$('#check-wrap').append($p);
					$('#p' + id_chk).append(chkbox, lab);
				}
				// disp validation button
				disp_button('Continuer !');
				// add required message if needed
				var $msg = $('<div />')
					.attr('id', 'required')
					.css('visibility','hidden')
					.html('Merci de choisir une ou plusieurs réponses.');
				display.append($msg);
				
				var check_answer = function(){
					
					// be sure at least one checkbox is checked
					var is_one = false;
					var all_corr = true;
					var all_chk = [];
					$('input[type=checkbox]').each(function(idx){
						if ($(this).is(":checked") === true){
							is_one = true;
							all_chk.push($(this).attr('id'));
							if ($(this).attr('value') !=="1"){
								all_corr = false;
							}
						}else{
							if ($(this).attr('value') ==="1"){
								all_corr = false;
							}
						}
					});
					if (!is_one){
						$('#required').css('visibility', 'visible');
						$('#check-wrap').change(function(){
							$('#required').css('visibility', 'hidden');
						});
					}else{
						// save data
						jsPsych.data.write({type: 'check', 
											id_stim: id_stim, 
											trial_num: istim+1, 
											resp: all_chk,
											correct: (all_corr) ? 1 : 0});
						display.html('');
						// add feedback
						var fb = check_form.feedback(all_corr);
						display.append('<div id="feedback">' + fb + '</div>');
						disp_button('Continuer avec un nouveau bout de phrase !');
						$('#submit').click(function(){
							display.html('');
							// next trial
							setTimeout(next_trial, 800);
						});
					}
				}
				// add click event
				$('#submit').click(function(){
					$('#required').css('visibility', 'hidden');
					check_answer();
				});				
			}

			disp_stim_click();

		};

		return plugin;
	})();
})(jQuery);
/** ------ end form-rating **/

/**------------------------------------- PLUGIN text **/
(function($) {
    jsPsych.text = (function() {

        var plugin = {};

        plugin.create = function(params) {

            params = jsPsych.pluginAPI.enforceArray(params, ['text']);
			
			params.end_type = (typeof params.end_type === 'undefined') ? 'keyboard' : params.end_type;
			params.button_string = (typeof params.button_string === 'undefined') ? 'OK' : params.button_string;
			params.allowed_keys = (typeof params.allowed_keys === 'undefined') ? [] : params.allowed_keys;
			
			// As much trials as stimuli (each stimuli = text to copy)
			var Ntr = params.text.length;
			// check if specific allowed keys array has been set for each trial
			var key_per_trial = (params.allowed_keys.length === Ntr) ? true : false;

			// define content and parameters for all successive trials
            var trials = new Array(Ntr);
			
            for (var i = 0; i < trials.length; i++) {
                trials[i] = {};
				// text to be displayed
                trials[i].text = params.text[i];
				// way to end the current trial
				trials[i].end_type = (Array.isArray(params.end_type)) ? params.end_type[i] : params.end_type;
				// button string
                trials[i].button_string = (Array.isArray(params.button_string)) ? params.button_string[i] : params.button_string;
				// keyboard allowed keys
				trials[i].allowed_keys = (key_per_trial) ? params.allowed_keys[i] : params.allowed_keys;

				// display text during the duration timing_stim, then go to the next trial
				// (without waiting for keyboard or mouse response)
				trials[i].timing_stim = params.timing_stim || -1; 
				// + Add timing_post_trial parameter (otherwise, the default value is 1000 in jspsych.js)
				trials[i].timing_post_trial = params.timing_post_trial || -1;
				// Minimum duration in ms
				trials[i].timing_min = (typeof params.timing_min === 'undefined') ? 0 : params.timing_min;
				
				// Progress bar
				trials[i].progbar = (typeof params.progbarstr === 'undefined') ? "" : params.progbarstr;
				trials[i].title = (typeof params.title === 'undefined') ? "" : params.title;	
            }
            return trials;
        };

        plugin.trial = function(display_element, trial) {

			display_element.html('');
            // if any trial variables are functions
            // this evaluates the function and replaces
            // it with the output of the function
            trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);
			
			var end_type = trial.end_type;
			var end_time = (trial.timing_stim > 0);
			
			var start_time = (new Date()).getTime();
			
			/**------ Display (title and) texte **/
			// With an animation for title 
			if (trial.title !== "") {
				// title duration
				var tdur = 800;
				
				trial.timing_min = trial.timing_min + tdur;
				var $title = $('<p\>')
							.addClass('title')
							.attr('style', 'font-size: 30px') //16px
							.html(trial.title);
				display_element.append($title);
				display_element.append(trial.text);
				/*$('.title').animate({fontSize: "30px"},
					{ 
						duration: tdur,
						complete: function(){										
							display_element.append(trial.text);
						}
					});*/
			}else{
				display_element.html(trial.text);
			}
						
			// Add the progress bar
			display_element.prepend(trial.progbar);
			
			// add the button if any
			if (end_type==='button'){
				
				// Add submit button				
				var $but = $('<div />')
						.addClass("button")
						.attr("id","submit")
						.html('<span>'+ trial.button_string+'</span>');
						
				display_element.append($but);
			}
			/**------ After response function **/
            var after_response = function(info) {
				// clear the display
                display_element.html(''); 
				// Keep data
				jsPsych.data.write({
					"rt": info.rt,
					"kp": info.key
				});
				// Next trial
                jsPsych.finishTrial();
            };
			/**------ Star event listener or finish trial **/
			if (end_time) {				
				setTimeout(function() {
						display_element.html('');
						jsPsych.finishTrial();
					}, trial.timing_stim);
						
			}else{	
				// Add a time delay before starting listeners (to prevent pressing/clicking
				// before instruction to be shown)
				setTimeout(function(){		
					if (end_type==='mouse') {	
						// Start mouse listener
						var mouse_listener = function(e) {
							var rt = (new Date()).getTime() - start_time;
							display_element.unbind('click', mouse_listener);
							after_response({key: 'mouse', rt: rt});
						};
						display_element.click(mouse_listener);	
					} else if (end_type==='button') {
						$('#submit').click(function(){
							var rt = (new Date()).getTime() - start_time;
							after_response({key: 'button', rt: rt});							
						});
					} else {
						// Start keyboard listener
						jsPsych.pluginAPI.getKeyboardResponse({
							callback_function: after_response,
							valid_responses: trial.allowed_keys,
							rt_method: 'date',
							persist: false,
							allow_held_key: false
						}); 
					}
				}, trial.timing_min);
			}	
        };

        return plugin;
    })();
})(jQuery);

/** -------------------------------------------- PLUGIN: form **/
(function($) {
	
	jsPsych['form'] = (function() {

		var plugin = {};

		plugin.create = function(params) {
			
			// Check for form_struct parameters 		
			var form_in = params.form_struct;		
			// array to keep all form elements with checked parameters
			var form_out = [];
			// array to store all id of element that make another visible
			var all_id_cond = [];
			// default params for each form element
			var def_obj = {	
				id: function(fobj, i){ return 'Q'+i;},
				quest: '',
				type: 'text',
				// length of input field of type text in number of character
				nchar_width: 20,
				// arr of options for radio/checkbox/select type
				opt_str: '',
				// associated array of unique id that will be used as answer value in output data
				opt_id: function(fobj, i){ return (fobj.type==='text')? [fobj.id] : '';},
				// maximum allowed number of checkbox checked
				check_lim: 0,
				// flag to know if answer if required before effective validation of the form
				required: 0,
				// conditionnal state: array of previous answer id (in opt_id) that can make this form element visible
				visible_if: []
			};
			// check for input parameters
			function check_form_obj(fobj, def_obj){
				var i = 1;
				for (var k in def_obj){					
					if (typeof fobj[k] === 'undefined'){
						fobj[k] = (typeof def_obj[k] === 'function') ? def_obj[k](fobj, i) : def_obj[k];
					}
					i++;
				}
				return fobj;
			}
			function force_arr(fobj, field_arr){
				for (var i=0; i<field_arr.length; i++){
					var fn = field_arr[i];
					fobj[fn] = (fobj[fn].length===0) ? fobj[fn] : ((typeof fobj[fn] === 'string') ? [fobj[fn]] : fobj[fn]);
				}
				return fobj;
			}
			
			for (var i=0 ; i < form_in.length ; i++){
				
				var fobj = form_in[i];
				// set default for undefined fields
				fobj = check_form_obj(fobj, def_obj);
				// add some parameters
				/* The number of character nchar is used to defined the width of
				of the input text field, which is expressed in em units. One em 
				corresponds to	height of a Ç",being about 130% higher than its width.*/
				fobj.input_width = (fobj.type==='text') ? Math.floor(fobj.nchar_width*0.7)+'em' : '';
				fobj.is_visible = (fobj.visible_if.length===0) ? true : false;
				// continue with this form element only if all necessary parameters have been set
				if ((fobj.type === "text" && fobj.quest==='') || 
					(fobj.type!=='text' && fobj.opt_str.length===0)){
						continue;
				}
					
				// force array for opt_str, opt_id and
				fobj = force_arr(fobj, ['opt_id', 'opt_str', 'visible_if']);
				
				// collect all id of element that will fire an event to make hidden element visible
				// define the "cond_ID" class of the hidden element based on the id of the 
				// element that will make it visible if it is checked
				var cond_vis = fobj.visible_if;
				var hid_class = '';
				for (var k=0 ; k<cond_vis.length ; k++){
					if ($.inArray(cond_vis[k], all_id_cond) === -1){
						all_id_cond.push(cond_vis[k]);
					}
					// be sure unique class name by combining the main question ID with the specific element id
					hid_class += 'cond_' + cond_vis[k] + ' ';
				}
				fobj.hidden_class = hid_class;
				// store new form element only if opt_str and quest have been set	
				form_out.push(fobj);
			}
			// add on change function to the cond_ID elements + div
			var disp_visible = function(){
				var quest_id = '#' + $(this).attr('id');
				// associated parent response div id
				$(quest_id + '>.cond_opt, '+quest_id+'>label>.cond_opt').each(function(){
					var cid = $(this).attr('id');
					if ($(this).is(':checked') === true){
						$('.cond_' + cid).removeClass('hiderow');
					}else{
						
						$('.cond_' + cid).addClass('hiderow');
					}
				});
			};
			for (var i=0 ; i<form_out.length ; i++) {
				var fobj = form_out[i];
				var Nopt = fobj.opt_id.length;
				// Array to know if an on change function has to be associated with the option				
				var opt_func_flag = [];
				for (var io = 0 ; io < Nopt ; io++) {
					if ($.inArray(fobj.id + '_' + fobj.opt_id[io], all_id_cond) > -1){
						opt_func_flag.push(1);
					}else{
						opt_func_flag.push(0);
					}
				}
				form_out[i].opt_func_flag = opt_func_flag;
			}
			var trials =[{
				preamble : (typeof params.preamble == 'undefined') ? "" : params.preamble,
				form_element : form_out,
				submit : (typeof params.submit == 'undefined') ? "Submit" : params.submit,
				progbar : (typeof params.progbarstr === 'undefined') ? "" : params.progbarstr,
				opt_func : disp_visible
			}];

			return trials;
		};

		plugin.trial = function(display, trial) {
			
			// Evaluates the function if any
			// trial.form_element = jsPsych.pluginAPI.evaluateFunctionParameters(trial.form_element);
			
			/**------ DISPLAY THE FORM **/
			// Clear the display
			display.html('');
			display.addClass('form');
		
			// Add progress bar
			display.append(trial.progbar);
			
			// Show preamble text
			var $preamb = $('<div/>')
				.attr('id','preamb')
				.html(trial.preamble)
				.addClass('form_preamble');	
				
			display.append($preamb);

			var $formdiv = $('<div/>')
				.attr('id','form')
				.addClass('form_div');	
				
			display.append($formdiv);
			var nrow = trial.form_element.length;

			/** FORM QUESTIONS AND OPTIONS **/
			// Add questions, input aeras and radio buttons
			for (var i=0; i<nrow; i++) {
				var elm = trial.form_element[i];
				var quest_id = elm.id;
				// visible elm ?
				var is_vis = elm.is_visible;
				var vis_class = (!is_vis) ? 'hiderow' : '';
				var $row = $('<div />')
					.addClass('form_row ' +  elm.hidden_class + ' ' + vis_class)
					.addClass((elm.required===0) ? 'form_onchg' : '')
					.attr('id', 'row_' + quest_id);
				$row.change(function(){ 
					$(this).addClass('form_onchg')
					.removeClass('reqanswer');
					// remove the required msg if all questions have been changed from the last validation
					if($('#required').css('display')==='block' && $('.reqanswer').length===0){
						$('#required').css('display', 'none');
					}
				});	
				$('#form').append($row);
				/** QUESTION **/
				// Question as div element
				var $quest =  $('<div/>')
					.addClass('form_quest')
					.html(elm.quest)
					.attr('name', quest_id);	
				
				// $('#form').append($quest);
				$('#row_' + quest_id).append($quest);
				// prepare answer column
				var $resp = $('<div/>')
					.addClass('form_resp')
					.attr('id', 'resp_' + quest_id);
					
				//$('#form').append($resp);
				$('#row_' + quest_id).append($resp);
				
				// ID of the response div-column element
				var rid = '#resp_' + quest_id;
				
				var input_type = elm.type;
				/** LIST TYPE **/
				if (input_type==='list'){
				
					var $list_sel = $('<select/>')
						.attr('name', quest_id)
						.attr('id', "list_" + quest_id)
						.addClass((elm.required===1)?'req':'');	
					
					$(rid).append($list_sel);
					
					// List choices
					// Add a first one "Choix" (if selected after submit, indicating that nothing had been selected)
						
					var $list_opt = $('<option/>')
						.attr('value', 'NA')
						.html('Sélectionner');
					
					$('#list_'+ quest_id).append($list_opt);						
					
					for (var j=0 ; j<elm.opt_str.length ; j++) {
						
						var $list_opt = $('<option/>')
							.attr('value', elm.opt_id[j]) 
							.attr('id', quest_id + '_' + elm.opt_id[j])
							.attr('name', quest_id)
							.html(elm.opt_str[j]);
							
							
						if (elm.opt_func_flag[j]===1){
							$list_opt.addClass('cond_opt');
							$list_sel.change(trial.opt_func);
						}
						$('#list_'+ elm.id).append($list_opt);
						
					}
				}
				/** OTHER TYPE RADIO, CHKBOX, TEXT... **/
				if (input_type !=='list'){
					/** LOOP // choices**/
					// display radio inline (few choices expected) --> inside a div wrapped by the flex-column div
					if (input_type === 'radio'){
						var $rad_div = $('<div />')
									.addClass('radio_div')
									.attr('id', 'raddiv_' + quest_id);
						$(rid).append($rad_div);
						rid = '#raddiv_' + quest_id;
					}
					for (var j=0; j<elm.opt_id.length; j++){
						var input_id = elm.opt_id[j];
						var uid = quest_id + '_' + input_id;
						var input_label = elm.opt_str[j];
						
						var $input = $('<input/>')
							.attr('type', input_type)
							.attr('id', uid)
							.attr('name', quest_id)
							.addClass(input_type + '_but choice')
							.css('width', elm.input_width)
							.addClass((elm.required===1)?'req':'');	
						// add associated value for radio or checkbox type
						if (input_type !== 'text'){
							$input.attr('value', input_id);
						}
						// label
						var $label = $('<label/>')
							.attr('id', 'lab' + uid)
							.attr('for', uid)
							.html(input_label)
							.addClass(input_type+'_lab');
						// add change function to the response div if this element fire a visibility change
						// of another question		
						if (elm.opt_func_flag[j]===1){
							$input.addClass('cond_opt');
							$(rid).change(trial.opt_func);
						}
						$(rid).append($label);
						$('#lab' + uid).prepend($input);
						// Prepend to have radio in the left
						// special for check_box
						// Attach maximum allowed choices
						// jaredhoyt's answer in http://stackoverflow.com/questions/10458924/limit-checked-checkbox-in-a-form
						if ((input_type==='checkbox') && (elm.check_lim>0)){
							var checkboxes = $('input[name=' + elm.id + ']');
							var max = elm.check_lim;
							checkboxes.change(function(){
									var current = checkboxes.filter(':checked').length;
									checkboxes.filter(':not(:checked)').prop('disabled', current >= max);
							});
						}
						
					}			
				}
			} // end loop // form rows
			
			var $msg = $('<div />')
				.attr('id', 'required')
				.css({'margin-top': '1em',
						'text-align': 'center',
						'width': '100%',
						'color': 'rgb(246, 108, 20)',
						'display': 'none'})
				.html('Merci de répondre à toutes les questions avant de valider.');
				
			display.append($msg);
			// Add submit button
			
			var $but = $('<div />')
					.addClass("button")
					.attr("id","submit")
					.html('<span>'+ trial.submit+'</span>');
			display.append($but);		  
			/**------ PARSE THE RESPONSES AFTER SUBMIT BUTTON CLICK **/
			
			$("#submit").click( function() {
				// Measure response time
				var endTime = (new Date()).getTime();
				var response_time = endTime - startTime;
				

				// Add hidden input for elements of type "select" (list) to hold the selected value
				$("#form select").each( function(index) {	
					var fname = $(this).attr("name"); 
					var val = $(this).val();
					if ($(this).hasClass('req')){
						var rq = 'req';
					}else{
						var rq = '';
					}
					// update value if element exists
					var idsel = '#selc_' + fname;
					if ($(idsel).length){
						
						$(idsel).attr("value", val);
						
					} else {
						var $selinput = $('<input/>')
							.attr('id', 'selc_'+ fname)
							.attr('type', 'hidden')
							.attr('name', fname)
							.attr('value', val)
							.addClass('choice')
							.addClass(rq)
							.addClass(($(this).hasClass('hiderow')) ? 'hiderow' : '');

						$("#form").append($selinput);
					}

				});
				
				// Create object to hold responses
				var form_data = {};	
				var is_req = {};
				var req_data = {};
				// Parse all input fields, store associated NAME (as "name") and VALUES	
				// Restrict to form_resp class only to avoid AdWare / SpyWare data inclusion (hidden input..)				
				$(".choice").each(function(idx) {
					var intyp = $(this).attr('type');
					var fname = $(this).attr('name'); 
					var val = $(this).val();
					// Initialize object key / content
					if (typeof req_data[fname]==='undefined'){
						req_data[fname] = 'NA';
					}
					// special case for checkbox (multiple values to be collected)
					if (typeof form_data[fname] === 'undefined' && intyp !=='checkbox'){
						form_data[fname] = 'NA';
					}					
					// Input text field or selected element or radio button : a unique answer 
					// to add to the field with the name value of the form_data object
					// For radio element, keep value only if it is checked
					if ( intyp==='text' || intyp==='hidden' || 
						(intyp==='radio' && $(this).is(':checked'))){
						if (val===''){
							val = 'NA';
						}
						req_data[fname] = val;
						form_data[fname] = val;
					}
					// Special case for checkbox type because several element (with the same "name" attribute)
					// could by checked
					if (intyp === 'checkbox'){
						
						if ($(this).is(':checked')){
							form_data[fname + '_' + val] = 1;
							req_data[fname] = val;
						}else{
							form_data[fname + '_' + val] = 0;
						}
					}
					if (typeof is_req[fname] === 'undefined'){						
						is_req[fname] = (!$('#row_' + fname).hasClass('hiderow') && $(this).hasClass('req')) ? 1 : 0;
					}
				});
				// Check if all response were given
				var isn = 0;
				for (var k in req_data) {
					if (req_data[k]==='NA' && is_req[k]===1 ){
						$('#row_'+ k).addClass('reqanswer').removeClass('form_onchg');
						isn = 1;
					}else{
						$('#row_'+ k).removeClass('reqanswer');
					}
				}
				
				if (isn==1){
					$('#required').css('display', 'block');
					
				}else{
					// save data
							
					jsPsych.data.write({
						"rt": response_time,
						"responses": form_data //JSON.stringify(form_data)
					});

					display.html('');
					display.removeClass('form');
					// next trial
					jsPsych.finishTrial();
				}
			});

			var startTime = (new Date()).getTime();
		};

		return plugin;
	})();
})(jQuery);
/**----- end PLUGIN form **/

/**----------------------------------------- STIMULI **/
function define_rating_block(){
	
	var example = [{cat: "non-met", str: "l'épée de feu", id: "id_ex", check: 0}];
	
	var rating_form = [
		{
		id : "comp",
		quest : "Ressentez-vous que cette phrase est compréhensible ?",
		opt_str : ["1", "2", "3", "4", "5", "6", "7"],
		opt_val : ["1", "2", "3", "4", "5", "6", "7"],
		opt_extlabel: ["Incompréhension totale", "Compréhension totale"],
		},
		{
		id : "fam",
		quest : "Ressentez-vous que cette phrase est familière ?",
		opt_str : ["1", "2", "3", "4", "5", "6", "7"],
		opt_val : ["1", "2", "3", "4", "5", "6", "7"],
		opt_extlabel: ["Non familiarité totale", "Familiarité totale"],
		},
		{
		id : "beau",
		quest : "Ressentez-vous que cette phrase est belle ?",
		opt_str : ["1", "2", "3", "4", "5", "6", "7"],
		opt_val : ["1", "2", "3", "4", "5", "6", "7"],
		opt_extlabel: ["Pas belle du tout", "Complètement belle"],
		},
		{
		id : "meta",
		quest : "Pensez-vous que cette phrase est une métaphore ?",
		opt_str : ["1", "2", "3", "4", "5", "6", "7"],
		opt_val : ["1", "2", "3", "4", "5", "6", "7"],
		opt_extlabel: ["Complètement non métaphorique", "Complètement métaphorique"],
		}
	];
	var ex_form = JSON.parse(JSON.stringify(rating_form));
	ex_form[0].quest += '<span class="ex_indic">(est-ce que cette expression vous semble facile à comprendre ?)</span>';
	ex_form[1].quest += '<span class="ex_indic">(est-ce que vous avez déjà rencontré cette expression ?)</span>';
	var all_stim = {
		list_1: [{cat:"met", str:"l'arbre de jade", id:"id_1", check:0},
			{cat:"no-met", str:"le vieux chêne", id:"id_2", check:0},
			{cat:"met", str:"la vitre est un jardin", id:"id_3", check:0},
			{cat:"no-met", str:"le coup de croc", id:"id_4", check:0},
			{cat:"no-met", str:"le cher sauveur", id:"id_5", check:0},
			{cat:"no-met", str:"le large ruban", id:"id_6", check:0},
			{cat:"no-met", str:"les paroles sont une énigme", id:"id_7", check:0},
			{cat:"met", str:"la gloire souveraine", id:"id_8", check:0},
			{cat:"met", str:"les sombres essais", id:"id_9", check:0},
			{cat:"no-met", str:"l'île immense", id:"id_10", check:1},
			{cat:"met", str:"les vivants souvenirs", id:"id_11", check:0},
			{cat:"no-met", str:"les coups de queue", id:"id_12", check:0},
			{cat:"met", str:"la neige chaude", id:"id_13", check:0},
			{cat:"met", str:"l'écho suave", id:"id_14", check:0},
			{cat:"no-met", str:"l'homme est le chef", id:"id_15", check:0},
			{cat:"no-met", str:"l'âme est le principe", id:"id_16", check:0},
			{cat:"met", str:"la compassion est une aumône", id:"id_17", check:0},
			{cat:"no-met", str:"la haine est un tourment", id:"id_18", check:0},
			{cat:"met", str:"le débordement est un déluge", id:"id_19", check:0},
			{cat:"met", str:"les strophes amères", id:"id_20", check:0},
			{cat:"met", str:"le spectacle de l'univers", id:"id_21", check:0},
			{cat:"met", str:"la joie est une ivresse", id:"id_22", check:1},
			{cat:"no-met", str:"les larmes sont les pleurs", id:"id_23", check:0},
			{cat:"met", str:"l'ombre pasible", id:"id_24", check:0},
			{cat:"met", str:"la douce nuit", id:"id_25", check:0},
			{cat:"met", str:"la peinture mouvante", id:"id_26", check:0},
			{cat:"met", str:"les ruts de la folie", id:"id_27", check:1},
			{cat:"no-met", str:"le prêtre du temple", id:"id_28", check:0},
			{cat:"no-met", str:"l'habitude est l'obéissance", id:"id_29", check:0},
			{cat:"met", str:"le cœur est un violon", id:"id_30", check:0},
			{cat:"no-met", str:"le nom de femme", id:"id_31", check:0},
			{cat:"no-met", str:"la terrasse est un observatoire", id:"id_32", check:0},
			{cat:"met", str:"la régente de la floraison", id:"id_33", check:0},
			{cat:"met", str:"les folles traces", id:"id_34", check:0},
			{cat:"no-met", str:"les secrets de l'âme", id:"id_35", check:0},
			{cat:"no-met", str:"le jour de solitude", id:"id_36", check:0},
			{cat:"no-met", str:"le nom est un objet", id:"id_37", check:0},
			{cat:"met", str:"le sanglot de lumière", id:"id_38", check:0},
			{cat:"met", str:"le livre de mes jours", id:"id_39", check:0},
			{cat:"no-met", str:"le reste est procédure", id:"id_40", check:0}],
		list_2:[{cat:"met", str: "les heures sont des gemmes", id: "id_41", check: 0},
			{cat:"met", str: "le calme est le nid", id: "id_42", check: 1},
			{cat:"no-met", str: "l'immensité de la mer", id: "id_43", check: 0},
			{cat:"met", str: "la beauté céleste", id: "id_44", check: 0},
			{cat:"no-met", str: "le bonnet de nuit", id: "id_45", check: 0},
			{cat:"no-met", str: "l'énorme voûte", id: "id_46", check: 0},
			{cat:"met", str: "les fanfares de gloire", id: "id_47", check: 0},
			{cat:"met", str: "le trône est une alcôve", id: "id_48", check: 0},
			{cat:"no-met", str: "les trous nouveaux", id: "id_49", check: 1},
			{cat:"met", str: "la vie ingrate", id: "id_50", check: 0},
			{cat:"met", str: "le souffle est un souvenir", id: "id_51", check: 0},
			{cat:"met", str: "le sang est une gloire", id: "id_52", check: 0},
			{cat:"no-met", str: "l'oiseau noir", id: "id_53", check: 0},
			{cat:"met", str: "le voyage est un maître", id: "id_54", check: 0},
			{cat:"met", str: "le nez de beurre", id: "id_55", check: 0},
			{cat:"met", str: "la vie est un rêve", id: "id_56", check: 0},
			{cat:"no-met", str: "les heures noires", id: "id_57", check: 0},
			{cat:"met", str: "les convives de fer", id: "id_58", check: 0},
			{cat:"met", str: "la flamme des boucles", id: "id_59", check: 0},
			{cat:"no-met", str: "les beaux jours", id: "id_60", check: 0},
			{cat:"met", str: "les murs des ténèbres", id: "id_61", check: 0},
			{cat:"no-met", str: "l'homme malheureux", id: "id_62", check: 0},
			{cat:"no-met", str: "le droit est le droit", id: "id_63", check: 0},
			{cat:"no-met", str: "le prêtre est un vieillard", id: "id_64", check: 0},
			{cat:"no-met", str: "la ligne de bataille", id: "id_65", check: 0},
			{cat:"no-met", str: "la goutte de vin", id: "id_66", check: 0},
			{cat:"no-met", str: "les peuples de la Terre", id: "id_67", check: 1},
			{cat:"met", str: "la vie est une hymne", id: "id_68", check: 0},
			{cat:"no-met", str: "au détours de la route", id: "id_69", check: 0},
			{cat:"met", str: "l'apôtre de la paix", id: "id_70", check: 0},
			{cat:"met", str: "le ciel tragique", id: "id_71", check: 0},
			{cat:"met", str: "les noms sont l'adieu", id: "id_72", check: 0},
			{cat:"no-met", str: "l'épouvantable voix", id: "id_73", check: 0},
			{cat:"no-met", str: "la longue chevelure", id: "id_74", check: 0},
			{cat:"no-met", str: "le reste est folie", id: "id_75", check: 0},
			{cat:"no-met", str: "le langage affété", id: "id_76", check: 0},
			{cat:"no-met", str: "les noms de princes", id: "id_77", check: 0},
			{cat:"met", str: "les chants délicieux", id: "id_78", check: 0},
			{cat:"no-met", str: "la morte est la femme", id: "id_79", check: 0},
			{cat:"no-met", str: "les ennemis sont des gens", id: "id_80", check: 0}],		
		list_3: [{cat:"no-met", str: "la robe de soirée", id: "id_81", check: 0},
			{cat:"no-met", str: "l'enfant des entrailles", id: "id_82", check: 1},
			{cat:"no-met", str: "les termes de loyer", id: "id_83", check: 0},
			{cat:"met", str: "les bases sont les reins", id: "id_84", check: 0},
			{cat:"no-met", str: "le ciel noir", id: "id_85", check: 0},
			{cat:"no-met", str: "la forme de delta", id: "id_86", check: 0},
			{cat:"met", str: "la feuille est un baiser", id: "id_87", check: 0},
			{cat:"met", str: "la voix frèle", id: "id_88", check: 0},
			{cat:"no-met", str: "l'ancien désespoir", id: "id_89", check: 0},
			{cat:"met", str: "les forêts de crucifix", id: "id_90", check: 0},
			{cat:"met", str: "l'arbre est un flot", id: "id_91", check: 0},
			{cat:"met", str: "cette âme est une exilée", id: "id_92", check: 0},
			{cat:"no-met", str: "la vieille cymbale", id: "id_93", check: 0},
			{cat:"no-met", str: "les jours de la gloire", id: "id_94", check: 0},
			{cat:"met", str: "la déception amère", id: "id_95", check: 0},
			{cat:"met", str: "le repos ardent", id: "id_96", check: 0},
			{cat:"no-met", str: "l'ouvrage de la mère", id: "id_97", check: 0},
			{cat:"met", str: "la foule sanglante", id: "id_98", check: 0},
			{cat:"no-met", str: "les joyeux voisins", id: "id_99", check: 1},
			{cat:"met", str: "l'hymne de l'âme", id: "id_100", check: 0},
			{cat:"no-met", str: "les lieux sont la scène", id: "id_101", check: 0},
			{cat:"no-met", str: "l'homme est l'esclave", id: "id_102", check: 0},
			{cat:"met", str: "l'ombre est un payx", id: "id_103", check: 0},
			{cat:"no-met", str: "les rives glacées", id: "id_104", check: 0},
			{cat:"met", str: "la nuit est le séjour", id: "id_105", check: 1},
			{cat:"no-met", str: "les froides mains", id: "id_106", check: 0},
			{cat:"no-met", str: "le supplice est la vertue", id: "id_107", check: 0},
			{cat:"no-met", str: "la source est une mer", id: "id_108", check: 0},
			{cat:"no-met", str: "le siècle est un moment", id: "id_109", check: 0},
			{cat:"met", str: "le vin de la jeunesse", id: "id_110", check: 0},
			{cat:"met", str: "la perle de la nature", id: "id_111", check: 0},
			{cat:"met", str: "le bouquet de gloire", id: "id_112", check: 0},
			{cat:"no-met", str: "les sommets neigeux", id: "id_113", check: 0},
			{cat:"met", str: "l'ange de la nuit", id: "id_114", check: 0},
			{cat:"met", str: "la pauvre âme", id: "id_115", check: 0},
			{cat:"no-met", str: "le front d'enfant", id: "id_116", check: 0},
			{cat:"met", str: "l'amoureux silence", id: "id_117", check: 0},
			{cat:"no-met", str: "les hommes sont les fils", id: "id_118", check: 0},
			{cat:"met", str: "la pureté de la clarté", id: "id_119", check: 0},
			{cat:"met", str: "les blocs du silence", id: "id_120", check: 0}]
	};

	var check_obj = {
		list_1: {
			id_10: 	{opt_str: ["L'étendue, les dimensions sont considérables", 
			"La phrase décrit les caractéristiques d'un objet", "La phrase décrit les caractéristiques d'un lieu", "L'étendue, les dimensions sont minuscules"],
					opt_val: [1, 0, 1, 0]},
			id_22: {opt_str: ["La phrase décrit un sentiment de trouble", "La phrase s'applique à quelqu'un qui a bu trop d'alcool", "La phrase s'applique à un lieu", "La phrase décrit un sentiment de clarté"],
					opt_val: [1, 0, 0, 0]},
			id_27:  {opt_str: ["La phrase s'applique à quelque chose de raisonné", "La phrase est en lien avec une agitation, une effervescence", "La phrase est en lien avec de la quiétude", "La phrase s'applique à quelque chose d'irraisonné"],
					opt_val: [0, 1, 0, 1]}
		},
		list_2: {
			id_42: 	{opt_str: ["La phrase décrit une personne", "La phrase décrit quelque chose de bruyant", "La phrase concerne un lieu", "La phrase décrit quelque chose de paisible"],
					opt_val: [0, 0, 1, 1]},
			id_49: {opt_str: ["Concerne quelque chose de neuf", "Décrit un sentiment", "Décrit quelque chose de concret", "Concerne quelque chose de vieux"],
					opt_val: [1, 0, 1, 0]},
			id_67:  {opt_str: ["Concerne un objet", "Décrit un lieu", "Décrit un ensemble ", "Concerne une personne en particulier"],
					opt_val: [0, 0, 1, 0]}					
		},
		list_3: {
			id_82: 	{opt_str: ["Décrit une population", "Concerne un objet", "Parle de la Terre", "Parle de lien de parenté"],
					opt_val: [0, 0, 0, 1]},
			id_99: {opt_str: ["Se rapporte à un objet", "Concerne des personnes", "Est en lien avec la tristesse", "Concerne quelque chose de gai"],
					opt_val: [0, 1, 0, 1]},
			id_105:  {opt_str: ["Se rapporte à une personne", "Se rapporte à l'obscurité", "Se rapporte à la lumière", "Concerne un objet"],	
					opt_val: [0, 1, 0, 0]}			
		}
	};


	// random draw of the list
	var irand = Math.floor(Math.random() * 3) + 1;
	var list = 'list_' + irand;
	
	// prepare the random stim
	var stim_obj = all_stim[list];
	stim_obj = jsPsych.randomization.repeat(stim_obj, 1, 0);
	var check_obj = check_obj[list];

	// keep the check point stim
	var check_stim = stim_obj.filter(function(x){return x.check===1});
	stim_obj = stim_obj.filter(function(x){return x.check===0});
	// Randomize
	stim_obj = jsPsych.randomization.repeat(stim_obj, 1, 0);	
	check_stim = jsPsych.randomization.repeat(check_stim, 1, 0);

	// insert check 
	var ir = [Math.floor(Math.random()*4)+3, Math.floor(Math.random()*4)+17, Math.floor(Math.random()*4)+30];
	for (var i=0 ; i<ir.length ; i++){
		stim_obj.splice(ir[i], 0, check_stim[i]);
	}
	
	var rating_block = {type: 'form-rating',
					stim: stim_obj,
					rating: rating_form,
					check: check_obj,
					check_form: {
						quest: "Par rapport à la phrase que vous venez d'évaluer, cochez la ou les affirmations que vous pensez justes :",
						submit: "Valider",
						feedback: function(istrue){return (istrue)? "Résultat : C'est exact !" : "Résultat : Tout est une question de point de vue...";}
						}
					};
	var ex_block = {
		type: 'form-rating',
		stim: example,
		rating: ex_form,
		check: {},
		check_form:{}
	};
	return {full: rating_block, example: ex_block};
}

function define_art_block(){
	var allart_1 = [{name: "Laurent Abel", id: "id_1", val:0},
		{name: "Alexis Achard", id: "id_2", val:0},
		{name: "Jean Anouilh", id: "id_3", val:1},
		{name: "Aimé Auban", id: "id_4", val:0},
		{name: "Marcel Aymé", id: "id_5", val:1},
		{name: "Antoine Bandin", id: "id_6", val:0},
		{name: "Joseph Barthelme", id: "id_7", val:0},
		{name: "Eugène Barthendier", id: "id_8", val:0},
		{name: "Claire Binoche", id: "id_9", val:0},
		{name: "Yves Bonnefoy", id: "id_10", val:1},
		{name: "Pierre Boulle", id: "id_11", val:1},
		{name: "André  Breton", id: "id_12", val:1},
		{name: "Charlotte Calvez", id: "id_13", val:0},
		{name: "Blaise Cendrars", id: "id_14", val:1},
		{name: "Andrée Chedid", id: "id_15", val:1},
		{name: "André Chénier", id: "id_16", val:1},
		{name: "Gilberte Chevallet", id: "id_17", val:0},
		{name: "Charles Cros", id: "id_18", val:1},
		{name: "Frédéric Dard", id: "id_19", val:1},
		{name: "Alphonse Daudet", id: "id_20", val:1},
		{name: "Théodore de Banville", id: "id_21", val:1},
		{name: "Choderlos de Laclos", id: "id_22", val:1},
		{name: "René de Obaldia", id: "id_23", val:1},
		{name: "Auguste Derbay", id: "id_24", val:0},
		{name: "Francisque Desarmeaux", id: "id_25", val:0},
		{name: "Virginie Despentes", id: "id_26", val:1},
		{name: "Paul Eluard", id: "id_27", val:1},
		{name: "Jacques Emery", id: "id_28", val:0},
		{name: "Rodolphe Eynaud", id: "id_29", val:0},
		{name: "Séraphin Ezingeard", id: "id_30", val:0}];
	
	var allart_2 = [{name: "Auguste Gabert", id: "id_31", val:0},
		{name: "Marguerite Galet", id: "id_32", val:0},
		{name: "André Gide", id: "id_33", val:1},
		{name: "Jean Giono", id: "id_34", val:1},
		{name: "Catherine Girard", id: "id_35", val:0},
		{name: "Francis Jammes", id: "id_36", val:1},
		{name: "Alfred Jarry", id: "id_37", val:1},
		{name: "Gisèle Jospa", id: "id_38", val:0},
		{name: "Joseph Kessel", id: "id_39", val:1},
		{name: "Lucie Klein", id: "id_40", val:0},
		{name: "Alice Lindermann", id: "id_41", val:0},
		{name: "Pierre Louÿs", id: "id_42", val:1},
		{name: "Amin Maalouf", id: "id_43", val:1},
		{name: "Maurice Maeterlinck", id: "id_44", val:1},
		{name: "Robert Merle", id: "id_45", val:1},
		{name: "Henri Michaux", id: "id_46", val:1},
		{name: "Jean-François Pellegrin", id: "id_47", val:0},
		{name: "Georges  Perec", id: "id_48", val:1},
		{name: "Francis Ponge", id: "id_49", val:1},
		{name: "Claude Roy", id: "id_50", val:1},
		{name: "Suzanne Saunier", id: "id_51", val:0},
		{name: "Eugène Sue", id: "id_52", val:1},
		{name: "Jules Supervielle", id: "id_53", val:1},
		{name: "Samuel Taboul", id: "id_54", val:0},
		{name: "Elsa Triolet", id: "id_55", val:1},
		{name: "Boris Vian", id: "id_56", val:1},
		{name: "Fabrice Woerth", id: "id_57", val:0}];
	return [{type: 'form-author', stim: allart_1}, 
	{type: 'form-author', stim: allart_2}];

}		
/* ------------------------- General overview */
//var form_blocks = function(npbar_ini, npbar_tot){
function define_form_blocks(){			// npbar_ini, npbar_tot

	var demographic = [
			{
		type: "list",
		id: "age",
		quest: "Quel âge avez-vous ?",
		opt_str : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "100", "101", "102", "103", "104", "105"],
		opt_id : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "100", "101", "102", "103", "104", "105"],
		required: 1
		},
		{
		type: "radio",
		id: "gender",
		quest: "Quel est votre genre ?",
		opt_str : ["M", "F", "autre"],
		opt_id : ["m", "f", "o"],
		required: 1
		},

		{
		type : "list",
		id : "diplome",
		quest : "Quel est le plus haut diplôme que vous ayez obtenu ?",
		opt_str : ["BEP", "CAP", "BEPC", "Baccalauréat", "BP", "BM", "Licence", "Master","Doctorat", "Autre"],
		opt_id : ["bep", "cap", "bepc", "bac", "bp", "bm", "lic", "master", "doct", "other"],
		required: 1
		},
		{
		type : "text",
		id : "diplome_oth",
		quest : "Si autre, précisez :",
		input_nchar: 20,
		visible_if : ["diplome_other"]
		},
		{
		type : "list",
		id : "bac",
		quest : "Si c'est le cas, quel baccalauréat avez-vous obtenu ?",
		opt_str : ["Littéraire", "Scientifique", "Economique", "Technologique", "Autre"],
		opt_id : ["litt", "scien", "eco", "tech", "oth"],
		required: 0
		},
		{
		type : "text",
		id : "bac_other",
		quest : "Si autre, précisez :",
		input_nchar: 20,
		visible_if : ["bac_oth"]
		},
		{
		type : "text",
		id : "sector",
		quest : "Quelle est votre filière de formation ?",
		input_nchar: 20
		},		
		{
		type : "list",
		id : "csp",
		quest : "Quelle est votre catégorie socio-professionnelle ?",
		opt_str : ["Agriculteurs exploitants", "Artisans, commerçants et chefs d'entreprise", "Cadres et professions intellectuelles supérieures", "Professions intermédiaires", "Employés", "Ouvriers", "Etudiants", "Retraités", "Sans emplois", "Autre"],
		opt_id : ["agri", "arti", "commerc", "cadre", "interm", "employe", "etud", "retrait", "sans", "autre"],
		required: 1
		},
		{
		type : "radio",
		id : "lang_nat",
		quest : "Votre langue maternelle : ",
		opt_str : ["français", "autre"],
		opt_id : ["fr", "ot"],
		required: 1
		},
		
		{
		type : "text",
		id : "lang_natoth",
		quest : "Si autre, précisez :",
		input_nchar: 20,
		visible_if : ["lang_nat_ot"]
		}

	];		

	var reading = [
		{
		type : "list",
		id : "freq_read",
		quest : "Je lis pour le plaisir :",
		opt_str : ["Presque jamais"," Quelques fois par an", "Quelques fois par mois", "Au moins une fois par semaine", "Une ou plusieurs fois par jour"],
		opt_id : ["1", "2", "3", "4", "5"],
		required: 1
		},
		{
		type : "list",
		id : "freq_book",
		quest : "A quelle fréquence lisez-vous des livres ?",
		opt_str : ["Jamais", "Entre 1 et 10 par an", "Entre 11 et 30 par an", "Entre 30 et 50 par an", "Plus de 50 par an"],
		opt_id : ["1", "2", "3", "4", "5"],
		required: 1
		},
		
		{
		type : "list",
		id : "freq_poet",
		quest : "A quelle fréquence lisez-vous de la poésie ?",
		opt_str : ["Jamais", "Entre 1 et 10 par an", "Entre 11 et 30 par an", "Entre 30 et 50 par an", "Plus de 50 par an"],
		opt_id : ["1", "2", "3", "4", "5"],
		required: 1
		},
		{
		type : "checkbox",
		id : "media_book",
		quest : "Sur quel(s) support(s) lisez-vous des livres ?",
		opt_str : ["Support papier", "Sur tablette/liseuse", "Audio", "Ecran d'ordinateur", "Je ne lis pas de livre"],
		opt_id : ["paper_a", "tablet_b", "audio_c", "pc_d", "no_e"],
		required: 1
		},
		{
		type : "checkbox",
		id : "media_poet",
		quest : "Sur quel(s) support(s) lisez-vous des poésies ?",
		opt_str : ["Support papier", "Sur tablette/liseuse", "Audio", "Ecran d'ordinateur", "Je ne lis pas de poésie"],
		opt_id : ["paper_a", "tablet_b", "audio_c", "pc_d", "no_e"],
		required: 1
		},
		{
		type : "checkbox",
		id : "get",
		quest : "Quelles sont vos habitudes pour vous procurer des livres (plusieurs réponses possibles) ?",
		opt_str : ["En librairie", "Via les sites marchants sur internet", "A la bibliothèque", "Par prêt", "Les boîtes à livres", "Les offres de livres gratuits disponibles", "Des versions pirates", "Cadeaux", "Je n'ai pas de livres"],
		opt_id : ["store_a", "web_b", "biblio_c", "pret_d", "box_e", "free_f", "pirate_g", "gift_h", "no_i"],
		required: 1
		},
		{
		type : "checkbox",
		id : "typlit",
		quest : "Quels sont les genres littéraires que vous lisez habituellement ?",
		opt_str : ["Poésie", "Romans historiques", "Romances", "Récits de voyage", "Classiques", "Littérature contemporaine", "Littérature étrangère", "Biographies", "Policiers, thrillers", "Science-fiction, fantasy", "Horreur", "Nouvelles", "Contes", "Témoignages", "Bien-être", "Essais", "Théatre", "Bandes dessinées"],
		opt_id : ["poesie_a", "histo_b", "romanc_c", "voyage_d", "classic_e", "lit_contemp_f", "lit_etrang_g", "biogr_h", "polic_i", "sc-fi_j", "horr_k", "nouv_l", "cont_m", "temoi_n", "bien_o", "essai_p", "theat_q", "bd_r"],
		required: 1
		}
	];
	var exp_problem = [
		{
		type: "radio",
		id: "exp_prob",
		quest: "Avez-vous rencontré un problème pendant cette expérience ?",
		opt_str : ["oui", "non"],
		opt_id : ["yes", "no"]
		},
		{
		type: "text",
		id: "exp_prob_which",
		quest: "Lequel ?",
		input_nchar: 50,
		visible_if : ["exp_prob_yes"]
		}
	];
 
	/* ================= Big form object */	
	//var iniarr = [];
	var hf_form = [
		{
			preamble: 'Quelques questions pour finir :',
			elements: demographic	
		},	
		{
			preamble: 'Au sujet de vos habitudes de lecture : <p class="small">' +
					'Sélectionner la réponse qui vous correspond le mieux.</p>',
			elements: reading
		},
		{
			preamble: 'Et enfin :',
			elements: exp_problem
		}
	];
		
	/*** Define ALL FORM BLOCKS*/

	var Npages = hf_form.length;
	var form_blocks = new Array(Npages);
	for (var i = 0; i < Npages ; i++) {
		
		form_blocks[i] = {
			type: "form",
			preamble: hf_form[i].preamble,
			progbar: false, //pbar,
			form_struct: hf_form[i].elements,
			submit: "Suivant"
		};
	}	
	form_blocks[Npages-1]["submit"] = "Validation finale !";
	return form_blocks;
};
