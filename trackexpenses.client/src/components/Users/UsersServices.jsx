import apiCall from "../../services/ApiCallGeneric/apiCall";

export  const getAllUsers = async () => {
  try {
    const res = await apiCall.get('Administrator/User/getAllUsers'); 
    
    if(!res || !res?.data || !res?.data?.ListUsers || !res?.data?.ListUsers.$values) return [];

    const listUsers = (res?.data?.ListUsers.$values || []).map(u => ({
      id: u.Id || u.id,
      email: u.Email || u.email,
      firstName: u.FirstName || u.firstName,
      familyName: u.FamilyName || u.familyName,
      birthday: u.BirthdayString || u.birthday,
      roles: u.Roles || u.roles || '-',
      groupOfUsers: u.GroupOfUsers || null
    }));
    return listUsers;

  } catch (err) {
    return [];
  }
};

