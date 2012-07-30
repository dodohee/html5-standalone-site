
/**
 * SaveResponseCommand
 */
var SaveResponseCommand = Cairngorm.Command.extend(
{
	execute : function ()
	{
		var _this = this;
		
		if ( BP.EM.selectedExercise == null )
			return;

		BP.EM.saveResponse();
	}
});