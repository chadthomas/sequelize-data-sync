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

		var associations = QueryHelper.getAssociations(sourceModel, targetModel, options);

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

				associations
					.forEach(function(association) {

						QueryHelper.getRelationRecords(
							association,
							sourceRecord,
							targetRecord,
							function(sourceRelationRecords, targetRelationRecords) {

								CompareHelper.compareAssociationRecords(
									association,
									sourceRelationRecords,
									targetRelationRecords,
									function(sourceRelationRecord) {

										if(association.type === 'BelongsToMany' ||
											association.type === 'BelongsTo') {

											QueryHelper
												.findRecordBy(
													association.targetModel,
													association.targetPivotKey,
													sourceRelationRecord[association.sourcePivotKey]
												)
												.then(function(targetRelationRecord) {
													if(!targetRelationRecord) {
														return;
													}

													if(!options.compareOnly) {
														switch(association.type) {

															case('BelongsToMany'):
																targetRecord[association.accessors.add](targetRelationRecord);
																break;

															case('BelongsTo'):
																targetRecord[association.accessors.set](targetRelationRecord);
																break;

														}
													}

													callRelationCallback(
														options,
														'onNew',
														association.name.singular,
														[
															targetRelationRecord,
															targetRecord,
															association.name.singular
														]
													);
												});

											return;
										}

										var recordData = QueryHelper.getRecordData(
											association.targetModel,
											association.targetPivotKey,
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
													association.name.singular,
													[
														targetRelationRecord,
														targetRecord,
														association.name.singular
													]
												);
											});
									},
									function(targetRelationRecord, changedKeys) {
										!options.compareOnly && targetRelationRecord.save();

										changedKeys.forEach(function(key) {
											var oldValue = targetRelationRecord.previous(key);
											var newValue = targetRelationRecord.get(key);

											callRelationCallback(
												options,
												'onUpdated',
												association.name.singular,
												[
													targetRelationRecord,
													key,
													oldValue,
													newValue,
													targetRecord,
													isNewRecord,
													association.name.singular
												]
											);
										});
									},
									function(targetRelationRecord) {

										!options.compareOnly &&
											targetRecord['remove' + association.name.plural](targetRelationRecord);

										callRelationCallback(
											options,
											'onDelete',
											association.name.singular,
											[
												targetRelationRecord,
												targetRecord,
												association.name.singular
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
	} else if(callCallback(options, name + 'Related', args)) {
		return true;
	}
}

module.exports = SequelizeDataSync;
