<?php

/**
 * Babelium Project open source collaborative second language oral practice - http://www.babeliumproject.com
 * 
 * Copyright (c) 2011 GHyM and by respective authors (see below).
 * 
 * This file is part of Babelium Project.
 *
 * Babelium Project is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Babelium Project is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

require_once(dirname(__FILE__) . "/../../config/Config.php");
require_once 'utils/Datasource.php';
require_once 'utils/SessionValidation.php';
require_once 'utils/CosineMeasure.php';

/**
 * This class performs subtitle related operations
 * 
 * @author Babelium Team
 */
class Subtitle {

	private $conn;

	public function __construct() {
		try {
			$verifySession = new SessionValidation();
			$settings = Config::getInstance();
			$this->conn = new Datasource ( $settings->host, $settings->db_name, $settings->db_username, $settings->db_password );
		} catch (Exception $e) {
			throw new Exception($e->getMessage());
		}
	}

	public function getExerciseRoles($exerciseId = 0) {
		if(!$exerciseId)
			return false;
			
		$sql = "SELECT MAX(id) as id,
					   fk_exercise_id as exerciseId,
					   character_name as characterName
				FROM exercise_role WHERE (fk_exercise_id = %d) 
				GROUP BY exercise_role.character_name ";

		$searchResults = $this->conn->_multipleSelect( $sql, $exerciseId );

		return $searchResults;
	}

	public function getSubtitlesSubtitleLines($subtitleId = 0) {
		if(!$subtitleId)
			return false;
		$sql = "SELECT SL.id, 
					   SL.show_time as showTime, 
					   SL.hide_time as hideTime, 
					   SL.text, 
					   SL.fk_exercise_role_id as exerciseRoleId, 
					   ER.character_name as exerciseRoleName, 
					   S.id as subtitleId
				FROM subtitle_line AS SL INNER JOIN subtitle AS S ON SL.fk_subtitle_id = S.id 
				INNER JOIN exercise AS E ON E.id = S.fk_exercise_id 
				RIGHT OUTER JOIN exercise_role AS ER ON ER.id=SL.fk_exercise_role_id
				WHERE (SL.fk_subtitle_id = %d)";

		$searchResults = $this->conn->_multipleSelect($sql, $subtitleId);

		return $searchResults;
	}

	/**
	 * Returns an array of subtitle lines for the given exercise.
	 *
	 * When subtitleId is not set the returned lines are the latest available ones.
	 * When subtitleId is set the returned lines are the ones of that particular subtitle.
	 * @param SubtitleAndSubtitleLineVO $subtitle
	 */
	public function getSubtitleLines($subtitle=null) {
		if(!$subtitle)
			return false;
		$subtitleId = $subtitle->id;
		$exerciseId = $subtitle->exerciseId;
		$language = $subtitle->language;

		if(!$subtitleId){

			$sql = "SELECT  SL.id,
							SL.show_time as showTime,
							SL.hide_time as hideTime, 
							SL.text, 
							SL.fk_exercise_role_id as exerciseRoleId, 
							ER.character_name as exerciseRoleName, 
							S.id as subtitleId
            		FROM (subtitle_line AS SL INNER JOIN subtitle AS S ON 
						 SL.fk_subtitle_id = S.id) INNER JOIN exercise AS E ON E.id = 
						 S.fk_exercise_id RIGHT OUTER JOIN exercise_role AS ER ON ER.id=SL.fk_exercise_role_id
					WHERE  S.id = (SELECT MAX(SS.id)
						       	   FROM subtitle SS 
						       	   WHERE SS.fk_exercise_id ='%d' AND SS.language = '%s') ";


			$searchResults = $this->conn->_multipleSelect ( $sql, $exerciseId, $language );
		} else {
			$sql = "SELECT  SL.id,
							SL.show_time as showTime,
							SL.hide_time as hideTime, 
							SL.text, 
							SL.fk_exercise_role_id as exerciseRoleId, 
							ER.character_name as exerciseRoleName, 
							S.id as subtitleId
            		FROM (subtitle_line AS SL INNER JOIN subtitle AS S ON 
						 SL.fk_subtitle_id = S.id) INNER JOIN exercise AS E ON E.id = 
						 S.fk_exercise_id RIGHT OUTER JOIN exercise_role AS ER ON ER.id=SL.fk_exercise_role_id
					WHERE  S.id='%d'";	
			$searchResults = $this->conn->_multipleSelect ( $sql, $subtitleId );
		}

		$recastedResults = $searchResults; //this is a dummy assignment for cross-compatibility
		//Store the last retrieved subtitle lines to check if there are changes when saving the subtitles.
		if($recastedResults)
			$_SESSION['unmodified-subtitles'] = $recastedResults;

		return $recastedResults;
	}
	

	public function getSubtitleLinesUsingId($subtitleId = 0) {
		if(!$subtitleId)
			return false;
		$sql = "SELECT SL.id,
					   SL.show_time as showTime,
					   SL.hide_time as hideTime, 
					   SL.text, 
					   SL.fk_exercise_role_id as exerciseRoleId, 
					   ER.character_name as exerciseRoleName, 
					   S.id as subtitleId
            	FROM (subtitle_line AS SL INNER JOIN subtitle AS S ON SL.fk_subtitle_id = S.id) 
            		 RIGHT OUTER JOIN exercise_role AS ER ON ER.id=SL.fk_exercise_role_id 
				WHERE ( S.id = %d )";

		$searchResults = $this->conn->_multipleSelect( $sql, $subtitleId );

		return $searchResults;
	}


	public function saveSubtitles($subtitleData = null){
		try {
			$verifySession = new SessionValidation(true);
			if(!$subtitleData)
				return false;
			else
				return $this->saveSubtitlesAuth($subtitleData);
		} catch (Exception $e) {
			throw new Exception($e->getMessage());
		}
	}

	private function saveSubtitlesAuth($subtitles) {

		$result = 0;
		$subtitleLines = $subtitles->subtitleLines;
		$exerciseId = $subtitles->exerciseId;
		
		if(!$this->_subtitlesWereModified($subtitleLines))
 			return "Provided subtitles have no modifications";
 
 		if(($errors = $this->_checkSubtitleErrors($subtitleLines)) != "")
 			return $errors;
			

		$this->conn->_startTransaction();

		//Insert the new subtitle on the database
		$s_sql = "INSERT INTO subtitle (fk_exercise_id, fk_user_id, language, adding_date, complete) ";
		$s_sql .= "VALUES (%d, %d, '%s', NOW(), %d ) ";
		$subtitleId = $this->conn->_insert($s_sql, $subtitles->exerciseId, $_SESSION['uid'], $subtitles->language, $subtitles->complete );
		if(!$subtitleId){
			$this->conn->_failedTransaction();
			throw new Exception("Subtitle save failed");
		}

		//Insert the new exercise_roles
		$er_sql = "INSERT INTO exercise_role (fk_exercise_id, fk_user_id, character_name) VALUES ";
		$params = array();
		$distinctRoles = array();	
		foreach($subtitleLines as $line){
			if(count($distinctRoles)==0){
				$distinctRoles[] = $line->exerciseRoleName;
				$er_sql .= " ('%d', '%d', '%s' ),";
				array_push($params, $subtitles->exerciseId, $_SESSION['uid'], $line->exerciseRoleName );
			}
			else if(!in_array($line->exerciseRoleName,$distinctRoles)){
				$distinctRoles[] = $line->exerciseRoleName;
				$er_sql .= " ('%d', '%d', '%s' ),";
				array_push($params, $subtitles->exerciseId, $_SESSION['uid'], $line->exerciseRoleName);
			}
		}
		unset($line);
		$er_sql = substr($er_sql,0,-1);
		// put sql query and all params in one array
		$merge = array_merge((array)$er_sql, $params);
		$lastRoleId = $this->conn->_insert($merge);
		if(!$lastRoleId){
			$this->conn->_failedTransaction();
			throw new Exception("Subtitle save failed");
		}


		//Insert the new subtitle_lines
		$params = array();
		$userRoles = $this->_getUserRoles($subtitles->exerciseId, $_SESSION['uid']);
		$sl_sql = "INSERT INTO subtitle_line (fk_subtitle_id, show_time, hide_time, text, fk_exercise_role_id) VALUES ";
		foreach($subtitleLines as $line){
			foreach($userRoles as $role){
				if ($role->characterName == $line->exerciseRoleName){
					$line->exerciseRoleId = $role->id;
					$sl_sql .= " ('%d', '%s', '%s', '%s', '%d' ),";
					array_push($params, $subtitleId, $line->showTime, $line->hideTime, $line->text, $line->exerciseRoleId);
					break;
				}
			}
			unset($role);
		}
		unset($line);
		$sl_sql = substr($sl_sql,0,-1);
		// put sql query and all params in one array
		$merge = array_merge((array)$sl_sql, $params);
		$lastSubtitleLineId = $this->conn->_insert($merge);
		if(!$lastSubtitleLineId){
			$this->conn->_failedTransaction();
			throw new Exception("Subtitle save failed");
		}

		//Update the user's credit count
		$creditUpdate = $this->_addCreditsForSubtitling();
		if(!$creditUpdate){
			$this->conn->_failedTransaction();
			throw new Exception("Credit addition failed");
		}

		//Update the credit history
		$creditHistoryInsert = $this->_addSubtitlingToCreditHistory($exerciseId);
		if(!$creditHistoryInsert){
			$this->conn->_failedTransaction();
			throw new Exception("Credit history update failed");
		}

		if ($subtitleId && $lastRoleId && $lastSubtitleLineId && $creditUpdate && $creditHistoryInsert){
			$this->conn->_endTransaction();

			$result = $this->_getUserInfo();
		}

		return $result;

	}

	private function _getUserRoles($exerciseId, $userId){
		$sql = "SELECT MAX(id) as id,
					   fk_exercise_id as exerciseId, 
					   character_name as characterName
		    	FROM exercise_role WHERE (fk_exercise_id = %d AND fk_user_id= %d) 
		    	GROUP BY exercise_role.character_name ";

		$searchResults = $this->conn->_multipleSelect ( $sql, $exerciseId, $userId );

		return $searchResults;
	}

	private function _addCreditsForSubtitling() {
		$sql = "UPDATE (users u JOIN preferences p)
				SET u.creditCount=u.creditCount+p.prefValue 
				WHERE (u.ID=%d AND p.prefName='subtitleAdditionCredits') ";
		return $this->conn->_update ( $sql, $_SESSION['uid'] );
	}

	private function _addSubtitlingToCreditHistory($exerciseId){
		$sql = "SELECT prefValue FROM preferences WHERE ( prefName='subtitleAdditionCredits' )";
		$result = $this->conn->_singleSelect ( $sql );
		if($result){
			$sql = "INSERT INTO credithistory (fk_user_id, fk_exercise_id, changeDate, changeType, changeAmount) ";
			$sql = $sql . "VALUES ('%d', '%d', NOW(), '%s', '%d') ";
			return $this->conn->_insert($sql, $_SESSION['uid'], $exerciseId, 'subtitling', $result->prefValue);
		} else {
			return false;
		}
	}

	private function _getUserInfo(){

		$sql = "SELECT name, 
					   creditCount, 
					   joiningDate, 
					   isAdmin
				FROM users WHERE (id = %d) ";

		return $this->conn->_singleSelect($sql, $_SESSION['uid']);
	}

	private function _subtitlesWereModified($compareSubject)
	{
		$modified=false;
		$unmodifiedSubtitlesLines = $_SESSION['unmodified-subtitles'];
		if (count($unmodifiedSubtitlesLines) != count($compareSubject))
			$modified=true;
		else
		{
			for ($i=0; $i < count($unmodifiedSubtitlesLines); $i++)
			{
				$unmodifiedItem = $unmodifiedSubtitlesLines[$i];
				$compareItem = $compareSubject[$i];
				if (($unmodifiedItem->text != $compareItem->text) || ($unmodifiedItem->showTime != $compareItem->showTime) || ($unmodifiedItem->hideTime != $compareItem->hideTime))
				{
					$modified=true;
					break;
				}
			}
		}
		return $modified;
	}

	private function _checkSubtitleErrors($subtitleCollection)
	{
		$errorMessage="";
			
		//Check empty roles, time overlappings and empty texts
		for ($i=0; $i < count($subtitleCollection); $i++)
		{
			if ($subtitleCollection[$i]->exerciseRoleId < 1)
				$errorMessage.="The role on the line " . ($i + 1) . " is empty.\n";
			$lineText = $subtitleCollection[$i]->text;
			$lineText = preg_replace("/[ ,\;.\:\-_?¿¡!€$']*/", "", $lineText);
			if (count($lineText) < 1)
				$errorMessage.="The text on the line " . ($i + 1) . " is empty.\n";
			if ($i > 0)
			{
				if ($subtitleCollection[($i-1)]->hideTime + 0.2 >= $subtitleCollection[$i]->showTime)
					$errorMessage.="The subtitle on the line " . $i . " overlaps with the next subtitle.\n";
			}
		}
		return $errorMessage;
	}

	private function _modificationRate($compareSubject){
		$unmodifiedSubtitlesLines = $_SESSION['unmodified-subtitles'];
		$currentText = '';
		$unmodifiedText = '';
		
		foreach ($compareSubject as $cline)
			$currentText .= preg_replace("/[ ,\;.\:\-_?¿¡!€$']*/", "", $cline->text)."\n";
		foreach ($unmodifiedSubtitlesLines as $uline)
			$unmodifiedText .= preg_replace("/[ ,\;.\:\-_?¿¡!€$']*/", "", $uline->text)."\n";
		$cosmeas = new CosineMeasure($currentText,$unmodifiedText);
		$cosmeas->compareTexts(); 
		$modificationRate = (strlen($unmodifiedText) - similar_text($unmodifiedText, $currentText)) * (strlen($unmodifiedText)/100);
		
	}
	

	public function getExerciseSubtitles($exerciseId = 0){
		if(!$exerciseId)
			return false;
		$sql = "SELECT s.id, 
					   s.fk_exercise_id as exerciseId, 
					   u.name as userName, 
					   s.language, 
					   s.translation, 
					   s.adding_date as addingDate
				FROM subtitle s inner join users u on s.fk_user_id=u.ID
				WHERE fk_exercise_id='%d'
				ORDER BY s.adding_date DESC";
		$searchResults = $this->conn->_multipleSelect ( $sql, $exerciseId );

		return $searchResults;
	}

	private function _deletePreviousSubtitles($exerciseId){
		//Retrieve the subtitle id to be deleted
		$sql = "SELECT DISTINCT s.id
				FROM subtitle_line sl INNER JOIN subtitle s ON sl.fk_subtitle_id = s.id
				WHERE (s.fk_exercise_id= '%d' )";

		$subtitleIdToDelete = $this->conn->_singleSelect($sql, $exerciseId);

		if($subtitleIdToDelete && $subtitleIdToDelete->id){
			//Delete the subtitle_line entries ->
			$sl_delete = "DELETE FROM subtitle_line WHERE (fk_subtitle_id = '%d')";
			$result = $this->conn->_delete($sl_delete, $subtitleIdToDelete->id);

			//The first query should suffice to delete all due to ON DELETE CASCADE clauses but
			//as it seems this doesn't work we delete the rest manually.

			//Delete the exercise_role entries
			$er_delete = "DELETE FROM exercise_role WHERE (fk_exercise_id = '%d')";
			$result = $this->conn->_delete($er_delete, $exerciseId);

			//Delete the subtitle entry
			$s_delete = "DELETE FROM subtitle WHERE (id ='%d')";
			$result = $this->conn->_delete($s_delete, $subtitleIdToDelete->id);
		}
	}
}

?>
