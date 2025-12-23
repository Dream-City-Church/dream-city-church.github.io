SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- api_Custom_2025Recap
-- =============================================
-- Description:		This stored procedure generates a 2025 recap report for a given user.
-- Created By:		Stephan Swinford
-- Last Modified:	
-- Updates:
-- =============================================
CREATE PROCEDURE  [dbo].[api_Custom_2025Recap]

	@DomainID INT
	,@UserName nvarchar(75) = null
	,@UserGUID uniqueidentifier = null

AS
BEGIN

	SET NOCOUNT ON;

	IF @UserName IS NULL AND @UserGuid IS NULL
		BEGIN
			RAISERROR('Either UserName or UserGUID parameter must be provided.',16,1);
			RETURN -1;
		END

	DECLARE @UserId INT = (SELECT TOP 1 User_ID FROM dp_Users WHERE Domain_ID = @DomainID AND (User_GUID = @UserGUID OR User_Name = @UserName));
	DECLARE @ContactId INT = (SELECT TOP 1 Contact_ID FROM Contacts WHERE Domain_ID = @DomainID AND User_Account = @UserId);
	DECLARE @ContactGuid UNIQUEIDENTIFIER = (SELECT TOP 1 Contact_GUID FROM Contacts WHERE Domain_ID = @DomainID AND Contact_ID = @ContactId);
	DECLARE @HouseholdId INT = (SELECT TOP 1 Household_ID FROM Contacts WHERE Domain_ID = @DomainID AND Contact_ID = @ContactId);

-- Dataset 1 - Basic Info
	SELECT 
		C.Nickname AS 'FirstName'
		,C.Last_Name AS 'LastName'
		,C.Email_Address AS 'UserEmailAddress'
		,H.Household_Name AS 'HouseholdName'
		,C.Household_Position_ID AS 'HouseholdPositionID'
		,H._Number_of_Members AS 'NumberOfHouseholdMembers'
		,ROUND(H.Driving_Distance,1) AS 'HouseholdDrivingDistanceMiles'
		,ROUND((H.Driving_Time*2/60),1) AS 'HouseholdRoundTripDrivingTimeHours'
		,(SELECT TOP 1 C2._Contact_Setup_Date FROM Contacts C2 WHERE C2.Domain_ID = @DomainID AND C2.Contact_ID = @ContactId AND YEAR(C2._Contact_Setup_Date) = 2025) AS 'UserContactSetupDate'
		,(SELECT TOP 1 A.[State/Region] FROM Addresses A JOIN Locations L ON L.Address_ID = A.Address_ID JOIN Congregations CON ON CON.Location_ID = L.Location_ID WHERE CON.Congregation_ID = H.Congregation_ID) AS 'UserCampusState'
		,(SELECT TOP 1 F.Unique_Name FROM dp_Files F WHERE F.Table_Name = 'Contacts' AND F.Record_ID = C.Contact_ID AND F.Default_Image = 1) AS 'UserProfileImageFileName'
	FROM Contacts C
	JOIN Households H ON H.Household_ID = C.Household_ID
	WHERE C.Domain_ID = @DomainID AND C.Contact_ID = @ContactId

-- Dataset 2 - Engagement Snapshots

	SELECT
		(SELECT TOP 1 DATEADD(hour,7,AL.Activity_Date) FROM Activity_Log AL WHERE AL.Domain_ID = @DomainID AND AL.Contact_ID = @ContactId AND YEAR(AL.Activity_Date) = 2025 AND AL.Activity_Type NOT LIKE '%05%' AND AL.Activity_Type NOT LIKE '%20%' ORDER BY AL.Activity_Date ASC) AS 'FirstActivity2025'
		,(SELECT TOP 1 AL.Record_Name FROM Activity_Log AL WHERE AL.Domain_ID = @DomainID AND AL.Contact_ID = @ContactId AND YEAR(AL.Activity_Date) = 2025 AND AL.Activity_Type NOT LIKE '%05%' AND AL.Activity_Type NOT LIKE '%20%' ORDER BY AL.Activity_Date ASC) AS 'FirstActivityName2025'
		,(SELECT TOP 1 DATEADD(hour,7,AL.Activity_Date) FROM Activity_Log AL WHERE AL.Domain_ID = @DomainID AND AL.Contact_ID = @ContactId AND YEAR(AL.Activity_Date) = 2025 AND AL.Activity_Type NOT LIKE '%05%' AND AL.Activity_Type NOT LIKE '%20%' ORDER BY AL.Activity_Date DESC) AS 'LastActivity2025'
		,(SELECT TOP 1 AL.Record_Name FROM Activity_Log AL WHERE AL.Domain_ID = @DomainID AND AL.Contact_ID = @ContactId AND YEAR(AL.Activity_Date) = 2025 AND AL.Activity_Type NOT LIKE '%05%' AND AL.Activity_Type NOT LIKE '%20%' ORDER BY AL.Activity_Date DESC) AS 'LastActivityName2025'
		,(SELECT COUNT(AL.Activity_Log_ID) FROM Activity_Log AL WHERE AL.Domain_ID = @DomainID AND AL.Contact_ID = @ContactId AND YEAR(AL.Activity_Date) = 2025) AS 'TotalActivities2025'
		,(SELECT COUNT(DISTINCT E.Event_ID) FROM Events E JOIN Event_Participants EP ON EP.Event_ID = E.Event_ID JOIN Contacts C ON C.Participant_Record= EP.Participant_ID WHERE E.Domain_ID = @DomainID AND C.Household_ID = @HouseholdId AND YEAR(E.Event_Start_Date) = 2025) AS 'TotalHouseholdEvents2025'
		,(SELECT COUNT(DISTINCT CAST(E.Event_Start_Date AS DATE)) FROM Events E JOIN Event_Participants EP ON EP.Event_ID = E.Event_ID JOIN Contacts C ON C.Participant_Record= EP.Participant_ID WHERE E.Domain_ID = @DomainID AND C.Household_ID = @HouseholdId AND YEAR(E.Event_Start_Date) = 2025) AS 'TotalHouseholdEventDays2025'
		,(SELECT COUNT(DISTINCT ISNULL(L.Congregation_ID,E.Congregation_ID)) FROM Events E JOIN Locations L ON L.Location_ID = E.Location_ID JOIN Event_Participants EP ON EP.Event_ID = E.Event_ID JOIN Contacts C ON C.Participant_Record= EP.Participant_ID WHERE E.Domain_ID = @DomainID AND C.Household_ID = @HouseholdId AND YEAR(E.Event_Start_Date) = 2025) AS 'HouseholdCampusesVisited2025'
		,(SELECT TOP 1 CON.Congregation_Name
		FROM Activity_Log AL
		JOIN Congregations CON ON CON.Congregation_ID = AL.Congregation_ID
		WHERE AL.Domain_ID = @DomainID AND AL.Household_ID = @HouseholdId AND YEAR(AL.Activity_Date) = 2025
		GROUP BY CON.Congregation_Name, CON.Congregation_ID
			ORDER BY (SELECT COUNT(AL.Activity_Date) FROM Activity_Log AL JOIN Congregations CON ON CON.Congregation_ID = AL.Congregation_ID WHERE AL.Domain_ID = @DomainID AND AL.Household_ID = @HouseholdId AND YEAR(AL.Activity_Date) = 2025 AND AL.Congregation_ID = CON.Congregation_ID)) AS 'MostActiveCampus2025'
		,CONCAT('https://my.dreamcitychurch.us/ministryplatformapi/files/',(SELECT TOP 1 F.Unique_Name
		FROM Activity_Log AL
		JOIN Congregations CON ON CON.Congregation_ID = AL.Congregation_ID
		JOIN dp_Files F ON F.Record_ID = CON.Congregation_ID AND F.Table_Name = 'Congregations' AND F.Default_Image = 1
		WHERE AL.Domain_ID = @DomainID AND AL.Household_ID = @HouseholdId AND YEAR(AL.Activity_Date) = 2025
		GROUP BY CON.Congregation_Name, CON.Congregation_ID, F.Unique_Name
			ORDER BY (SELECT COUNT(AL.Activity_Date) FROM Activity_Log AL JOIN Congregations CON ON CON.Congregation_ID = AL.Congregation_ID WHERE AL.Domain_ID = @DomainID AND AL.Household_ID = @HouseholdId AND YEAR(AL.Activity_Date) = 2025 AND AL.Congregation_ID = CON.Congregation_ID))) AS 'MostActiveCampusImageURL'
		,(SELECT TOP 1 M.Ministry_Name
		FROM Activity_Log AL
		JOIN Ministries M ON M.Ministry_ID = AL.Ministry_ID
		WHERE AL.Domain_ID = @DomainID AND AL.Household_ID = @HouseholdId AND YEAR(AL.Activity_Date) = 2025
		GROUP BY M.Ministry_Name,M.Ministry_ID
			ORDER BY (SELECT COUNT(AL.Activity_Date) FROM Activity_Log AL JOIN Ministries M ON M.Ministry_ID = AL.Ministry_ID WHERE AL.Domain_ID = @DomainID AND AL.Household_ID = @HouseholdId AND YEAR(AL.Activity_Date) = 2025 AND AL.Ministry_ID = M.Ministry_ID)) AS 'MostActiveFamilyMinistry2025'
		,(SELECT TOP 1 M.Ministry_Name
		FROM Activity_Log AL
		JOIN Ministries M ON M.Ministry_ID = AL.Ministry_ID
		WHERE AL.Domain_ID = @DomainID AND AL.Contact_ID = @ContactId AND YEAR(AL.Activity_Date) = 2025
		GROUP BY M.Ministry_Name,M.Ministry_ID
			ORDER BY (SELECT COUNT(AL.Activity_Date) FROM Activity_Log AL JOIN Ministries M ON M.Ministry_ID = AL.Ministry_ID WHERE AL.Domain_ID = @DomainID AND AL.Household_ID = @HouseholdId AND YEAR(AL.Activity_Date) = 2025 AND AL.Ministry_ID = M.Ministry_ID)) AS 'MostActiveIndividualMinistry2025'

-- Dataset 3 - Most Popular Event
	SELECT TOP 1
		E.Event_Title AS 'MostAttendedEvent2025'
		,DATEADD(hour,7,E.Event_Start_Date) AS 'Event_Start_Date'
		,COUNT(EP.Participant_ID) AS 'TotalAttendees2025'
	FROM Event_Participants EP 
	JOIN Events E ON E.Event_ID = EP.Event_ID
	JOIN Event_Participants EP_HH ON EP_HH.Event_ID = E.Event_ID
	JOIN Contacts C_HH ON C_HH.Participant_Record = EP_HH.Participant_ID AND C_HH.Contact_ID = @ContactId
	WHERE EP.Participation_Status_ID < 5
	  AND E.Domain_ID = @DomainID
	  AND YEAR(E.Event_Start_Date) = 2025
	GROUP BY E.Event_Title, E.Event_Start_Date, E.Event_ID
	ORDER BY COUNT(EP.Participant_ID) DESC

-- Dataset 4 - Group Stats
	SELECT
		(SELECT COUNT(DISTINCT G.Group_ID) FROM Groups G JOIN Group_Participants GP ON GP.Group_ID = G.Group_ID JOIN Contacts C ON C.Participant_Record = GP.Participant_ID WHERE G.Domain_ID = @DomainID AND G.Group_Type_ID IN(1,2,3,10,15,21,24,26,27) AND C.Household_ID = @HouseholdId AND YEAR(GP.Start_Date) = 2025) AS 'GroupsJoined2025'
		,(SELECT COUNT(DISTINCT G.Group_ID) FROM Groups G JOIN Group_Participants GP ON GP.Group_ID = G.Group_ID JOIN Contacts C ON C.Participant_Record = GP.Participant_ID WHERE G.Domain_ID = @DomainID AND G.Group_Type_ID IN(1,2,3,10,15,21,24,26,27) AND C.Household_ID = @HouseholdId AND GP.End_Date IS NULL) AS 'ActiveGroups2025'
		,(SELECT COUNT(DISTINCT G.Group_ID) FROM Groups G JOIN Group_Participants GP ON GP.Group_ID = G.Group_ID JOIN Contacts C ON C.Participant_Record = GP.Participant_ID JOIN Group_Roles GR ON GR.Group_Role_ID = GP.Group_Role_ID WHERE G.Domain_ID = @DomainID AND G.Group_Type_ID IN(1,2,3,10,15,21,24,26,27) AND C.Household_ID = @HouseholdId AND GP.End_Date IS NULL AND GR.Group_Role_Type_ID=1)
		+ (SELECT COUNT(DISTINCT G.Group_ID) FROM Groups G WHERE G.Domain_ID = @DomainID AND G.Group_Type_ID IN(1,2,3,10,15,21,24,26,27) AND G.Primary_Contact=@ContactId AND ISNULL(G.End_Date,GetDate()) >= GetDate()) AS 'LeadingGroups2025'

-- Dataset 5 - Volunteer Stats
	SELECT
		(SELECT COUNT(DISTINCT EP.Event_ID) FROM Event_Participants EP 
		JOIN Events E ON E.Event_ID = EP.Event_ID 
		JOIN Groups G ON G.Group_ID = EP.Group_ID
		JOIN Group_Roles GR ON GR.Group_Role_ID = EP.Group_Role_ID
		JOIN Contacts C ON C.Participant_Record = EP.Participant_ID
			WHERE E.Domain_ID = @DomainID 
			AND EP.Participation_Status_ID < 5 
			AND G.Group_Type_ID IN (10,26) 
			AND GR.Group_Role_Type_ID <> 2
			AND YEAR(E.Event_Start_Date) = 2025
			AND C.Household_ID = @HouseholdId) AS 'HouseholdVolunteerEvents2025'
		,(SELECT SUM(DATEDIFF(HOUR, E.Event_Start_Date, E.Event_End_Date)) FROM Event_Participants EP 
		JOIN Events E ON E.Event_ID = EP.Event_ID
		JOIN Groups G ON G.Group_ID = EP.Group_ID
		JOIN Group_Roles GR ON GR.Group_Role_ID = EP.Group_Role_ID
		JOIN Contacts C ON C.Participant_Record = EP.Participant_ID
			WHERE E.Domain_ID = @DomainID 
			AND EP.Participation_Status_ID < 5 
			AND G.Group_Type_ID IN (10,26) 
			AND GR.Group_Role_Type_ID <> 2
			AND YEAR(E.Event_Start_Date) = 2025
			AND C.Household_ID = @HouseholdId) AS 'HouseholdVolunteerHours2025'

-- Dataset 6 - Household Milestones Accomplished
	SELECT 
	M.Milestone_Title,
	PM.Date_Accomplished,
	(SELECT C.Nickname + ' ' + C.Last_Name FROM Contacts C WHERE C.Participant_Record = PM.Participant_ID) AS 'MilestoneAccomplishedBy2025',
	CASE WHEN C.Contact_ID = @ContactId THEN 1 ELSE 0 END AS 'IsCurrentUser'
	FROM Participant_Milestones PM 
	JOIN Contacts C ON C.Participant_Record = PM.Participant_ID 
	JOIN Milestones M ON M.Milestone_ID = PM.Milestone_ID 
	WHERE PM.Domain_ID = @DomainID 
	AND M.Journey_ID IN (1,4,11,12) 
	AND C.Household_Position_ID = 1
	AND C.Household_ID = @HouseholdId 
	AND NOT EXISTS (SELECT 1 FROM Participant_Milestones PM2 WHERE PM2.Domain_ID = PM.Domain_ID AND PM2.Participant_ID = PM.Participant_ID AND PM2.Milestone_ID = PM.Milestone_ID AND PM2.Date_Accomplished < PM.Date_Accomplished)
	AND YEAR(PM.Date_Accomplished) = 2025

-- Dataset 7 - Prayer & Praise
	SELECT
		(SELECT COUNT(F.Feedback_Entry_ID) FROM Feedback_Entries F WHERE F.Domain_ID = @DomainID AND F.Contact_ID = @ContactId AND F.Feedback_Type_ID = 1 AND YEAR(F.Date_Submitted) = 2025) AS 'TotalPrayers2025'
		,(SELECT COUNT(F.Feedback_Entry_ID) FROM Feedback_Entries F WHERE F.Domain_ID = @DomainID AND F.Contact_ID = @ContactId AND F.Feedback_Type_ID = 2 AND YEAR(F.Date_Submitted) = 2025) AS 'TotalPraises2025'
		,(SELECT Count(PA.Prayer_Action_ID) FROM Prayer_Actions PA WHERE PA.Domain_ID = @DomainID AND PA.Action <> 'skipped' AND PA.[User_ID] = @UserId AND YEAR(PA.Action_Date) = 2025) AS 'TotalPrayedForOthers2025'
		,(SELECT SUM(F.Prayer_Counter) FROM Feedback_Entries F WHERE F.Domain_ID = @DomainID AND F.Contact_ID = @ContactId AND F.Feedback_Type_ID < 3 AND YEAR(F.Date_Submitted) = 2025) AS 'TotalOthersPrayedForUser2025'

-- Dataset 8 - Household Donations Summary
	SELECT
		(SELECT COALESCE(COUNT(D.Donation_ID), 0) + COALESCE(COUNT(DD.Donation_ID), 0) FROM Contribution_Statements CS
			LEFT JOIN Donations D ON D.Statement_ID = CS.Statement_ID
			LEFT JOIN Donation_Distributions DD ON DD.Soft_Credit_Statement_ID = CS.Statement_ID
			WHERE CS.Domain_ID = @DomainID AND CS.Household_ID = @HouseholdId AND CS.Statement_Year = 2025) AS 'TotalHouseholdGifts2025'
		,CAST(ROUND((SELECT COALESCE(SUM(D.Donation_Amount), 0) + COALESCE(SUM(DD.Amount), 0) FROM Contribution_Statements CS
			LEFT JOIN Donations D ON D.Statement_ID = CS.Statement_ID
			LEFT JOIN Donation_Distributions DD ON DD.Soft_Credit_Statement_ID = CS.Statement_ID
			WHERE CS.Domain_ID = @DomainID AND CS.Household_ID = @HouseholdId AND CS.Statement_Year = 2025),0,0) AS INT) AS 'TotalHouseholdGiving2025'

-- Dataset 9 - Giving Events - Returns if the user household gave to specific programs in 2025
	SELECT
		CASE WHEN (SELECT SUM(DD.Amount) FROM Donation_Distributions DD
			JOIN Donations D ON D.Donation_ID = DD.Donation_ID
			JOIN Programs P ON P.Program_ID = DD.Program_ID
			JOIN Contribution_Statements CS ON CS.Statement_ID = D.Statement_ID
			WHERE CS.Household_ID=@HouseholdId AND CS.Statement_Year = 2025 AND P.Statement_Header_ID=8 AND P.Pledge_Campaign_ID IS NOT NULL) > 0 THEN 1 ELSE 0 END AS 'GaveToKingdomBuilders2025'
		,CASE WHEN (SELECT SUM(DD.Amount) FROM Donation_Distributions DD
			JOIN Donations D ON D.Donation_ID = DD.Donation_ID
			JOIN Programs P ON P.Program_ID = DD.Program_ID
			JOIN Contribution_Statements CS ON CS.Statement_ID = D.Statement_ID
			WHERE CS.Household_ID=@HouseholdId AND CS.Statement_Year = 2025 AND DD.Program_ID=419) > 0 THEN 1 ELSE 0 END AS 'GaveToOneDayToFeedTheWorld2025'
		,CASE WHEN (SELECT SUM(DD.Amount) FROM Donation_Distributions DD
			JOIN Donations D ON D.Donation_ID = DD.Donation_ID
			JOIN Programs P ON P.Program_ID = DD.Program_ID
			JOIN Contribution_Statements CS ON CS.Statement_ID = D.Statement_ID
			WHERE CS.Household_ID=@HouseholdId AND CS.Statement_Year = 2025 AND DD.Program_ID=839) > 0 THEN 1 ELSE 0 END AS 'GaveToBikeBuild2025'
			,CASE WHEN (SELECT SUM(DD.Amount) FROM Donation_Distributions DD
			JOIN Donations D ON D.Donation_ID = DD.Donation_ID
			JOIN Programs P ON P.Program_ID = DD.Program_ID
			JOIN Contribution_Statements CS ON CS.Statement_ID = D.Statement_ID
			WHERE CS.Household_ID=@HouseholdId AND CS.Statement_Year = 2025 AND DD.Program_ID=313) > 0 THEN 1 ELSE 0 END AS 'GaveToTurkeyGiveaway2025'

-- Dataset 10 - Encoded links for webview
	SELECT
		'https://apps.dreamcitychurch.us/prayer?cid=' + CAST(@ContactGuid AS NVARCHAR(50)) AS 'PrayerWebViewLink';

-- Check if the user already has a milestone for viewing their 2025 recap. If not, create
	IF NOT EXISTS (SELECT 1 FROM Participant_Milestones PM JOIN Contacts C ON C.Participant_Record = PM.Participant_ID WHERE PM.Domain_ID = @DomainID AND C.Contact_ID = @ContactId AND PM.Milestone_ID = 81)
		BEGIN
			INSERT INTO Participant_Milestones (Domain_ID, Program_ID, Participant_ID, Milestone_ID, Date_Accomplished)
			VALUES (@DomainID, 810, (SELECT TOP 1 C.Participant_Record FROM Contacts C WHERE C.Domain_ID = @DomainID AND C.Contact_ID = @ContactId), 81, GETDATE());
		END

END
GO
