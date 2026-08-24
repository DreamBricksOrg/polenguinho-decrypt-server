from bson import ObjectId

PICKUP_MESSAGE = "retirada_registrada_no_cadastro"


class LogRepository:
    def __init__(self, database, project_id, collection_name="logs"):
        self.collection = database[collection_name]
        self.project_id = ObjectId(project_id) if project_id else None

    def list_pickups(self):
        pipeline = [
            {"$match": {"project_id": self.project_id, "message": PICKUP_MESSAGE}},
            {
                "$project": {
                    "_id": 0,
                    "horario": "$timestamp",
                    "email": "$data.email",
                    "userId": "$data.id",
                    "session": "$data.session_id",
                    "recall": {"$ifNull": ["$data.recalled", False]},
                }
            },
            {"$sort": {"horario": 1}},
        ]
        return [self._serialize(document) for document in self.collection.aggregate(pipeline)]

    @staticmethod
    def _serialize(document):
        horario = document.get("horario")
        if hasattr(horario, "isoformat"):
            document["horario"] = horario.isoformat()
        return document
