<?php

require_once(dirname(__FILE__) . "/Module.php");

// API
require_once(dirname(__FILE__) . "/../api/services/Evaluation.php");

class MEvaluation extends Module
{	
	public static function load($args)
	{
		parent::load($args);
		
		$content = "";
		$loggedIn = self::$sessionManager->isLoggedIn();
		
		if ( !$loggedIn )
			return WidgetLoader::loadWidget("Unauthorized");
			
		if ( self::$state != "min" )
			$content = WidgetLoader::loadWidget("EvaluationTabBar",
							self::$config->restrictedEvaluation,
							self::$sessionManager->getUserData()->isAdmin);
		else
			$content = "";
		
		/**
		 * SWITCH ACTION
		 */
		if ( self::$action == "touser" )
		{
			$evaluation = new Evaluation();
			$response = $evaluation->getResponsesAssessedToCurrentUser()->data;
			
			if ( !empty(self::$params) )
			{
				$assesmentVO;
				
				list($responseId, $index) = explode(";", self::$params);
				
				// Assesments done by user
				foreach ( $response as $assesment )
				{
					if ( $assesment->responseId == $responseId )
					{
						$assesmentVO = $assesment;
						break;
					}
				}
				
				$details = $evaluation->detailsOfAssessedResponse(self::$params);
				$userNames = array();
				
				foreach ( $details as $comment )
					array_push($userNames, $comment->userName);
				
				/*if ( !isset($index) || $index >= count($response) || $index < 0 )
					$index = 0;*/
				
				$content .= WidgetLoader::loadWidget("AssessedToUser", $details, $assesmentVO, $userNames);
			}
		}
		else if	( self::$action == "byuser" )
		{
			$evaluation = new Evaluation();
			$response = $evaluation->getResponsesAssessedByCurrentUser();
			
			// Check for selected assesment
			if ( !empty(self::$params) )
			{
				// Assesments done by user
				foreach ( $response as $assesment )
				{
					if ( $assesment->responseId == self::$params )
					{
						$content .= WidgetLoader::loadWidget("AssessedByUser", $assesment);
						break;
					}
				}
			}
		}
		else
		{
			$evaluation = new Evaluation();
			$response = $evaluation->getResponsesWaitingAssessment();
			
			// Check for selected assesment
			if ( !empty(self::$params) )
			{
				// Assesments done by user
				foreach ( $response as $assesment )
				{
					if ( $assesment->responseId == self::$params )
					{
						$content .= WidgetLoader::loadWidget("WaitingForEvaluation", $assesment);
						break;
					}
				}
			}
		}
		
		/**
		 * IF ANY, SHOW ASSESMENT LIST
		 */
		if ( isset($response) && self::$state != "min" )
			$content .= WidgetLoader::loadWidget("EvaluationDataTable", $response, self::$action);
		
		return $content;
	}
}

?>