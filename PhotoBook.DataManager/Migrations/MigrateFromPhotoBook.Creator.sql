USE [PhotoBookv2Creator]
GO

delete from [PhotoBookv2Creator].[dbo].[FileSystemFolders]
go

INSERT INTO [PhotoBookv2Creator].[dbo].[FileSystemFolders]
           ([Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[Path]
           ,[ParentId])
     select [Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[Path]
           ,[ParentId]
	from [PhotoBookCreatorv2].[dbo].[FileSystemFolders] f

	
GO

set IDENTITY_INSERT dbo.[Locations] on
go

INSERT INTO [PhotoBookv2Creator].[dbo].[Locations]
           (Id, 
		   [Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[PlaceId])
select Id
		   ,[Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[PlaceId]
from [PhotoBookCreatorv2].[dbo].[Locations]
Go
set IDENTITY_INSERT dbo.[Locations] off
go


set IDENTITY_INSERT dbo.Components on
go
INSERT INTO [dbo].[Components]
           (Id,	   
		   [Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[LongName]
           ,[ShortName]
           ,[TypesString])
select Id, [Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[LongName]
           ,[ShortName]
           ,[TypesString]
from [PhotoBookCreatorv2].[dbo].[GoogleAddressComponents]

go
set IDENTITY_INSERT dbo.Components off
go

INSERT INTO [PhotoBookv2Creator].[dbo].[LocationComponent]
           ([LocationId]
           ,[ComponentId]
		   ,[Created]
           ,[CreatedBy])
SELECT [LocationRefId]
      ,[ComponentRefId]
	  ,(select top 1 Created from [PhotoBookCreatorv2].[dbo].Locations L WHERE L.Id = LC.LocationRefId order by Created desc)
	  ,(select top 1 CreatedBy from [PhotoBookCreatorv2].[dbo].Locations L WHERE L.Id = LC.LocationRefId order by Created desc)

  FROM [PhotoBookCreatorv2].[dbo].[LocationComponent] LC

go
set IDENTITY_INSERT dbo.[PhotoBooks] on
go

INSERT INTO [dbo].[PhotoBooks]
           (Id
		   ,[Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[Title]
           ,[TimeFrame])
SELECT [Id]
           ,[Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[Title]
           ,[TimeFrame]
  FROM [PhotoBookCreatorv2].[dbo].[PhotoBooks]
GO
set IDENTITY_INSERT dbo.[PhotoBooks] off
set IDENTITY_INSERT dbo.[Thumbnails] on
go

INSERT INTO [PhotoBookv2Creator].[dbo].[Thumbnails]
           ([Id]
           ,[Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[FileName]
           ,[FileSystemFolderId]
           ,[Bytes]
           ,[Hide]
           ,[Scanned]
           ,[ImageWidth]
           ,[ImageHeight]
           ,[FileCreateDateTime]
           ,[Latitude]
           ,[Longitude]
           ,[Altitude]
           ,[LocationId])
select [Id]
           ,[Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[FileName]
           ,[FileSystemFolderId]
           ,[Bytes]
           ,[Hide]
           ,[Scanned]
           ,[ImageWidth]
           ,[ImageHeight]
           ,[FileCreateDateTime]
           ,[Latitude]
           ,[Longitude]
           ,[Altitude]
           ,[LocationId]
from [PhotoBookCreatorv2].[dbo].[Thumbnails]    

go
set IDENTITY_INSERT dbo.[Thumbnails] off
go

INSERT INTO [dbo].[PhotoItems]
           ([ThumbnailId]
           ,[PhotoBookId]
           ,[Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy])
select [ThumbnailId]
           ,[PhotoBookId]
           ,[Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
from [PhotoBookCreatorv2].[dbo].[PhotoItems]

GO

INSERT INTO [dbo].[TagTypes]
           ([Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[Name])
Select [Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[Name]
from [PhotoBookCreatorv2].[dbo].[TagTypes]
where [Name] != 'Person'

GO

INSERT INTO [dbo].[Tags]
           ([Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[Name]
           ,[TagTypeId])
select [Created]
           ,[CreatedBy]
           ,[LastUpdated]
           ,[LastUpdatedBy]
           ,[Name]
           ,[TagTypeId]
from [PhotoBookCreatorv2].[dbo].[Tags]
where [Name] != 'Unknown'
GO