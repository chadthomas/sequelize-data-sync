'use strict'

require('object.values').shim();

module.exports = {

	forEachRecord: function(model, perRecordCallback) {
		var index = 0;

		function getRecord() {
			return model.find({
				offset: index
			})
				.then(function(record) {
					if(!record) {
						return; //End of results
					}

					perRecordCallback(record);

					return getRecord(++index);
				});
		}

		return getRecord();
	},

	findRecordBy: function(model, key, value) {
		var where = {};
		where[key] = value;

		return model.findOne({
			where: where
		});
	},

	checkRecordForUpdates: function(targetModel, key, sourceRecord, targetRecord, updatedRecordCallback) {
		var isNewRecord = targetRecord.$options.isNewRecord;
		if(isNewRecord) {
			return targetRecord;
		}

		var recordData = this.getRecordData(targetModel, key, sourceRecord);

		targetRecord.set(recordData);

		var changedKeys = targetRecord.changed();
		if(changedKeys) {
			updatedRecordCallback(targetRecord, changedKeys, isNewRecord);
		}

		return targetRecord;
	},

	getRecordData: function(targetModel, pivotKey, record) {
		var recordData = record.get();

		// Remove any target primary keys unless they are our pivot
		targetModel.primaryKeyAttributes.forEach(function(primaryKey) {
			if(pivotKey && pivotKey == primaryKey) {
				return;
			}

			delete recordData[primaryKey];
		});

		return recordData;
	},

	getRelationRecords: function(association, sourceRecord, targetRecord, dataCallback) {

		return sourceRecord[association.accessors.get]()
			.then(function(sourceRelationRecords) {

				return targetRecord[association.accessors.get]()
					.then(function(targetRelationRecords) {

						return dataCallback(
							arrayWrap(sourceRelationRecords),
							arrayWrap(targetRelationRecords)
						);
					});
			});
	},

	getAssociations: function(sourceModel, targetModel, options) {
		var sourceAssociationNames = getAssociationNames(sourceModel.associations);
		var targetAssociationNames = getAssociationNames(targetModel.associations);

		var associations = [];

		for(var associationName in options.include) {
			if(sourceAssociationNames.indexOf(associationName) === -1 ||
				targetAssociationNames.indexOf(associationName) === -1) {
				
				// If this association does not exist on both models, drop it
				delete options.include[associationName];
				return;
			}

			var associationRef = options.include[associationName];
			var modelAssociation = Object.values(targetModel.associations)
				.find(function(modelAssociation) {
					return modelAssociation.options.name.singular == associationName;
				});

			if(typeof associationRef === 'string') {
				associationRef = {
					sourcePivotKey: associationRef,
					targetPivotKey: associationRef
				};
			}

			var sourcePivotKey = associationRef.sourcePivotKey;
			var targetPivotKey = associationRef.targetPivotKey;

			if(!sourcePivotKey && sourcePivotKey !== true) {
				sourcePivotKey = options.sourcePivotKey;
			}
			if(!targetPivotKey && targetPivotKey !== true) {
				targetPivotKey = options.targetPivotKey;
			}

			associations.push({
				type: modelAssociation.associationType,
				name: modelAssociation.options.name,
				sourceModel: modelAssociation.source,
				targetModel: modelAssociation.target,
				accessors: modelAssociation.accessors,
				sourcePivotKey: sourcePivotKey,
				targetPivotKey: targetPivotKey
			});
		}

		return associations;
	}
}

function getAssociationNames(associations) {
	return Object.values(associations)
		.map(function(association) {
			return association.options.name.singular;
		});
}

function arrayWrap(value) {
	if(Array.isArray(value)) {
		return value;
	}

	if(value == null) {
		return [];
	}

	return [value];
}