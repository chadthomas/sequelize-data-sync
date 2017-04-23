# sequelize-data-sync

- transfer `sequelize` db data from one model to another

## use
```javascript
SequelizeDataSync.syncData(
	< sourceModel >,
	< targetModel >,
	{
		pivotKey: 'id',
		/*
			Key used to pair records
		*/
		
		enableRelations: false, 
		/*
			Only goes one level deep.
			Will establish association with BelongsTo / BelongsToMany relations,
			will create new records (if needed) for hasOne / hasMany relations
		*/
		
		exclude: ['< plural relation name'>],
		/*
			Relations to exclude.
			NOTE: THIS IS THE PLURAL NAME, NOT SINGULAR LIKE USED ELSEWHERE.
		*/
		
		compareOnly: false,
		/*
			Only fire callbacks, don't migrate data
		*/
		
		/****
		***** Callbacks
		****/
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
  
  