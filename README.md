# sequelize-data-sync

- transfer `sequelize` db data from one model to another

## use
```javascript
SequelizeDataSync.syncData(
	sourceModel,
	targetModel,
	{
		idKey: 'myIdProperty',
		/*
			default: id
			(optional) Key used to identify records
		*/
		
		pivotKey: 'myPropertyName',
		/*
			(optional) Key used to pair records from source to target
		*/

		enableRelations: false, 
		/*
			default: false
			(optional)
			Only goes one level deep.
			Will establish association with BelongsTo / BelongsToMany relations,
			will create new records (if needed) for hasOne / hasMany relations
		*/

		exclude: ['PluralRelationName>'],
		/*
			default: []
			(optional) 
			Relations to exclude.
			NOTE: THIS IS THE PLURAL NAME, NOT SINGULAR LIKE USED ELSEWHERE.
		*/

		relationIdKeys: {
			'PluralRelationName': 'otherIdProperty'
		},
		/*
			default: []
			(optional)
			Key used to identify relation records, if this is not provided for a relation we use < idKey >
			NOTE: THIS IS THE PLURAL NAME, NOT SINGULAR LIKE USED ELSEWHERE.
		*/

		relationPivotKeys: {
			'PluralRelationName': 'otherProperty'
		},
		/*
			default: []
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
		onNewRelatedData: function(relationRecord, record, singularRelationName) {},

		onUpdate< singular relation name >: function(relationRecord, key, oldValue, newValue, record, isNewRecord, singularRelationName) {},
		onUpdateRelatedData: function(relationRecord, key, oldValue, newValue, record, isNewRecord, singularRelationName) {},

		onDelete< singular relation name >: function(relationRecord, record, singularRelationName) {},
		onDeleteRelatedData: function(relationRecord, record, singularRelationName) {}
	}
);
```
## License
MIT
  
  