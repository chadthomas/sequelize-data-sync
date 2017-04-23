# sequelize-data-sync

- transfer `sequelize` db data from one model to another

## use
```javascript
SequelizeDataSync.syncData(
	sourceModel,
	targetModel,
	{	
		pivotKey: 'myPropertyName',
		/*
			default: 'id'
			(optional) Default pivot key
		*/

		sourcePivotKey: 'myPropertyName',
		targetPivotKey: 'myPropertyName',
		/*
			(optional) Override pivotKey for a specific model
		*/
		
		include: {
			'PluralRelationName': {
				pivotKey: 'otherProperty',
				sourcePivotKey: 'otherProperty',
				targetPivotKey: 'otherProperty'
			},
			'PluralRelationName': 'otherProperty',
			'PluralRelationName': true,
			....
		},
		/*
			default: {}
			(optional)
			Key used to pair relation records from source to target, if this is not provided for a relation we use < pivotKey >
			NOTE: THIS IS THE PLURAL NAME, NOT SINGULAR LIKE USED ELSEWHERE.
		*/

		compareOnly: false,
		/*
			default: false
			(optional)
			Only fire callbacks, don't migrate data
		*/

		/****
		***** Callbacks
		****/

		// All callbacks are optional

		onNewRecord: function(record) {},

		onUpdateRecord: function(record, key, newValue, oldValue, isNewRecord) {},

		onDeleteRecord: function(record) {},

		onNew< singular relation name >: function(relationRecord, record, singularRelationName) {},
		onNewRelated: function(relationRecord, record, singularRelationName) {},

		onUpdate< singular relation name >: function(relationRecord, key, oldValue, newValue, record, isNewRecord, singularRelationName) {},
		onUpdateRelated: function(relationRecord, key, oldValue, newValue, record, isNewRecord, singularRelationName) {},

		onDelete< singular relation name >: function(relationRecord, record, singularRelationName) {},
		onDeleteRelated: function(relationRecord, record, singularRelationName) {}
	}
);
```
## License
MIT
  
  