'use strict'

var Promise = require('bluebird');
var QueryHelper = require('./lib/query');
var CompareHelper = require('./lib/compare');
var extend = require('extend');

var SequelizeDataSync = {

	compareData: function(sourceModel, targetModel, options) {
		options.compareOnly = true;
		this.syncData(sourceModel, targetModel, options);
	},

	syncData: function(sourceModel, targetModel, options) {

		options = extend(
			{
				compareOnly: false,
				pivotKey: 'id',
				sourcePivotKey: false,
				targetPivotKey: false,
				include: {},
				onNewRecord: false,
				onUpdateRecord: false,
				onDeleteRecord: false,
				onNewRelatedData: false,
				onUpdateRelatedData: false,
				onDeleteRelatedData: false
			},
			options || {}
		);

		if(typeof options.include !== 'object') {
			options.include = {};
		}

		if(!options.sourcePivotKey) {
			options.sourcePivotKey = options.pivotKey;
		}

		if(!options.targetPivotKey) {
			options.targetPivotKey = options.pivotKey;
		}

		var matchingRelationNames = QueryHelper.getMatchingRelationNames(sourceModel, targetModel);

		return CompareHelper.compareModels(
			sourceModel,
			targetModel,
			options.sourcePivotKey,
			options.targetPivotKey,
			function(sourceRecord) {
				var recordData = QueryHelper.getRecordData(
					targetModel,
					options.targetPivotKey,
					sourceRecord
				);

				if(options.compareOnly) {
					return targetModel.build(recordData);
				}

				return targetModel.create(recordData)
					.then(function(targetRecord) {

						callCallback(
							options,
							'onNewRecord',
							[
								targetRecord
							]
						);

						return targetRecord;
					});
			},
			function(targetRecord, changedKeys, isNewRecord) {
				!options.compareOnly && targetRecord.save();

				changedKeys.forEach(function(key) {
					var oldValue = targetRecord.previous(key);
					var newValue = targetRecord.get(key);

					callCallback(
						options,
						'onUpdateRecord',
						[
							targetRecord,
							key,
							oldValue,
							newValue,
							isNewRecord
						]
					);
				});
			},
			function(targetRecord) {
				!options.compareOnly && targetRecord.destroy();

				callCallback(
					options,
					'onDeleteRecord',
					[
						targetRecord
					]
				); 
			},
			function(sourceRecord, targetRecord) {
				var isNewRecord = targetRecord.$options.isNewRecord;

				matchingRelationNames
					.forEach(function(pluralRelationName) {

						var association = targetModel.associations[pluralRelationName];
						var singularRelationName = association.options.name.singular;

						var sourceRelationPivotKey = options.sourcePivotKey;
						var targetRelationPivotKey = options.targetPivotKey;

						QueryHelper.getRelationRecords(
							association,
							sourceRecord,
							targetRecord,
							function(sourceRelationRecords, targetRelationRecords) {

								CompareHelper.compareRelationRecords(
									association.target,
									sourceRelationRecords,
									targetRelationRecords,
									sourceRelationPivotKey,
									targetRelationPivotKey,
									function(sourceRelationRecord) {
										if(association.associationType === 'BelongsToMany' ||
											association.associationType === 'BelongsTo') {

											QueryHelper
												.findRecordBy(
													association.target,
													targetRelationPivotKey,
													sourceRelationRecord[sourceRelationPivotKey]
												)
												.then(function(targetRelationRecord) {
													if(!targetRelationRecord) {
														return;
													}

													!options.compareOnly && 
														targetRecord[association.accessors.add](targetRelationRecord);

													callRelationCallback(
														options,
														'onNew',
														singularRelationName,
														[
															targetRelationRecord,
															targetRecord,
															singularRelationName
														]
													);
												});

											return;
										}

										var recordData = QueryHelper.getRecordData(
											association.target,
											targetRelationPivotKey,
											sourceRelationRecord
										);

										function _build(recordData) {
											if(options.compareOnly) {
												return Promise.bind(this).then(function() {
													recordData[targetModel.options.name.singular] = targetRecord;
													return association.target.build(recordData);
												});
											}

											return targetRecord[association.accessors.create](recordData);
										}

										return _build(recordData)
											.then(function(targetRelationRecord) {

												callRelationCallback(
													options,
													'onNew',
													singularRelationName,
													[
														targetRelationRecord,
														targetRecord,
														singularRelationName
													]
												);
											});
									},
									function(targetRelationRecord, changedKeys) {
										if(association.associationType === 'BelongsToMany' ||
											association.associationType === 'BelongsTo') {
											return;
										}

										!options.compareOnly && targetRelationRecord.save();

										changedKeys.forEach(function(key) {
											var oldValue = targetRelationRecord.previous(key);
											var newValue = targetRelationRecord.get(key);

											callRelationCallback(
												options,
												'onUpdated',
												singularRelationName,
												[
													targetRelationRecord,
													key,
													oldValue,
													newValue,
													targetRecord,
													isNewRecord,
													singularRelationName
												]
											);
										});
									},
									function(targetRelationRecord) {

										!options.compareOnly &&
											targetRecord['remove' + pluralRelationName](targetRelationRecord);

										callRelationCallback(
											options,
											'onDelete',
											singularRelationName,
											[
												targetRelationRecord,
												targetRecord,
												singularRelationName
											]
										);
									}
								);
							}
						);

					});
			}
		);
	},

	forEachRecord: function(model, perRecordCallback) {
		return QueryHelper.forEachRecord(model, perRecordCallback);
	}
};

function callCallback(options, name, args) {
	var callback = options[name];

	if(typeof callback === 'function') {
		callback.apply(this, args);
		return true;
	}

	return false;
}

function callRelationCallback(options, name, singularRelationName, args) {

	if(callCallback(options, name + singularRelationName, args)) {
		return true;
	} else if(callCallback(options, name + 'RelatedData', args)) {
		return true;
	}
}

module.exports = SequelizeDataSync;
