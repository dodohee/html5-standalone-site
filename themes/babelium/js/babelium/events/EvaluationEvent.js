
/**
 * Evaluation Event
 */

var EvaluationEvent = Cairngorm.Event.extend(
{
	init : function ( type, evaluation, responseId, sortField, pageNumber )
	{
		this._super(type, {"evaluation" : evaluation, "responseId" : responseId,
							"sortField" : sortField, "pageNumber" : pageNumber});
	}
});

// Constants
EvaluationEvent.VIEW_PENDING_ASSESMENTS = "viewPendingAssesments";
EvaluationEvent.VIEW_CURRENTLY_ASSESSED_TO_USER = "viewAssessedToUser";
EvaluationEvent.VIEW_CURRENTLY_ASSESSED_BY_USER = "viewAssessedByUser";

EvaluationEvent.VIEW_EVALUATION_ASSESMENT = "viewEvaluationAsesment";
EvaluationEvent.VIEW_REVISION_ASSESMENT = "viewRevisionAssesment";
EvaluationEvent.VIEW_ASSESSED_ASSESMENT = "viewAssessedAssesment";

EvaluationEvent.RESET_EVALUATION_FORM_DATA = "resetEvaluationFormData";
EvaluationEvent.SEND_EVALUATION_FORM_DATA = "sendEvaluationFormData";