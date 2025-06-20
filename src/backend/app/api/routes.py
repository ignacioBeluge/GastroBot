from fastapi import APIRouter, HTTPException
from app.models.schemas import QueryRequest, QueryResponse
from app.services.query_service import QueryService

router = APIRouter()
query_service = QueryService()

@router.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    try:
        response = await query_service.process_query(request.query)
        return QueryResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reload")
async def reload_data():
    try:
        await query_service.reload_data()
        return {"message": "Data reloaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 